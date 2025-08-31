/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"; // ES Modules import

const client = new S3Client({
	region: "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
	}
});

export async function GET(request: NextRequest) {
	const input = {
		Bucket: "s3-clone-project",
	};

	const command = new ListObjectsV2Command(input);
    const result = await client.send(command);

	console.log(result);
	return NextResponse.json(
		{
			message: "Hello from the API",
			data: result
		},
		{ status: 200 }
	);
}
