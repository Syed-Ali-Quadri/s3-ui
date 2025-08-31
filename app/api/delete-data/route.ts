import { NextResponse } from "next/server";

export async function DELETE() {
    return NextResponse.json(
        {
            message: "Data deleted successfully"
        },
        {
            status: 200
        }
    );
}
