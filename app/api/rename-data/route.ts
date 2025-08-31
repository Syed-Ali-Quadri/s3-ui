import { NextResponse } from "next/server";

export async function PUT() {
    return NextResponse.json(
        {
            message: "Data renamed successfully"
        },
        {
            status: 200
        }
    );
}
