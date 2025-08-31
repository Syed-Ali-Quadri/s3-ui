import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
    return NextResponse.json(
        {
            message: "Data deleted successfully"
        },
        {
            status: 200
        }
    );
}
