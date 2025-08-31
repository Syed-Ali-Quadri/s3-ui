import { NextResponse } from "next/server";

export async function Put() {
    return NextResponse.json(
        {
            message: "Data renamed successfully"
        },
        {
            status: 200
        }
    );
}
