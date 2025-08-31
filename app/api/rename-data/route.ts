import { NextRequest, NextResponse } from "next/server";

export async function Put(request: NextRequest) {
    return NextResponse.json(
        {
            message: "Data renamed successfully"
        },
        {
            status: 200
        }
    );
}
