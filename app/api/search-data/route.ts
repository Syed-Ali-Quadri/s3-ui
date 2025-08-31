import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json(
        {
            message: "Search data fetched successfully"
        },
        {
            status: 200
        }
    );
}
