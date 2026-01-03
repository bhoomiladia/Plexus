import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Application from "@/models/Application";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  await dbConnect();

  const apps = await Application.find({ userId: session.user.id });
  return NextResponse.json(apps);
}