import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Expense from "@/models/Expense";
import { getCurrentUser } from "@/lib/auth";
import { logError } from "@/lib/logger";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await request.json();

    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(user.userId);
    const categoryTotals = await Expense.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTotals = await Expense.aggregate([
      { $match: { user: userObjectId, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const overallStats = await Expense.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$amount" },
          totalCount: { $sum: 1 },
          avgExpense: { $avg: "$amount" },
          maxExpense: { $max: "$amount" },
          minExpense: { $min: "$amount" },
        },
      },
    ]);

    const recentExpenses = await Expense.find({ user: userObjectId })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    const stats = overallStats[0] || {
      totalSpent: 0,
      totalCount: 0,
      avgExpense: 0,
      maxExpense: 0,
      minExpense: 0,
    };

    const categoryBreakdown = categoryTotals
      .map((c) => `${c._id}: ₹${c.total.toFixed(2)} (${c.count} expenses)`)
      .join("\n");

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthlyBreakdown = monthlyTotals
      .map((m) => `${monthNames[m._id.month - 1]} ${m._id.year}: ₹${m.total.toFixed(2)}`)
      .join("\n");

    const recentExpenseList = recentExpenses
      .map((e) => `${new Date(e.date).toLocaleDateString()}: ${e.description} - ₹${e.amount.toFixed(2)} (${e.category})`)
      .join("\n");

    const expenseContext = `
USER'S EXPENSE DATA:

Overall Statistics:
- Total Spent: ₹${stats.totalSpent?.toFixed(2) || "0.00"}
- Total Transactions: ${stats.totalCount || 0}
- Average Expense: ₹${stats.avgExpense?.toFixed(2) || "0.00"}
- Highest Expense: ₹${stats.maxExpense?.toFixed(2) || "0.00"}
- Lowest Expense: ₹${stats.minExpense?.toFixed(2) || "0.00"}

Spending by Category:
${categoryBreakdown || "No expenses yet"}

Monthly Spending (Last 6 Months):
${monthlyBreakdown || "No monthly data"}

Recent Expenses:
${recentExpenseList || "No recent expenses"}
`;

    const systemPrompt = `You are a helpful AI financial assistant for the ExpenseTrack app. Your name is FinBot. You help users understand and manage their expenses.

You have access to the user's expense data provided below. Use this information to:
1. Answer questions about their spending habits
2. Provide insights about their expense patterns
3. Suggest ways to save money based on their spending
4. Help them understand where their money is going
5. Give personalized financial tips

Always be friendly, helpful, and encouraging. If the user asks about something not related to their finances or expenses, politely redirect them to financial topics.

When providing spending analysis:
- Be specific with numbers from their actual data
- Identify their highest spending categories
- Point out any concerning patterns
- Offer actionable advice
- Be encouraging about positive habits

${expenseContext}

Remember: The user is "${user.name}". Address them by name occasionally to make the conversation personal.`;

    const convertedMessages = messages.map(
      (m: {
        role: string;
        parts?: { type: string; text: string }[];
        content?: string;
      }) => ({
        role: m.role,
        content: m.parts
          ? m.parts.filter((p) => p.type === "text").map((p) => p.text).join("")
          : m.content || "",
      }),
    );

    const result = streamText({
      model: groq("llama-3.1-8b-instant"),
      system: systemPrompt,
      messages: convertedMessages,
    });

    return new Response(result.textStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    logError(error, "api/chat");
    return new Response("Internal server error", { status: 500 });
  }
}