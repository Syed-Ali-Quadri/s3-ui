import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
	region: "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
	}
});

export async function GET() {
	const input = {
		Bucket: "s3-clone-project"
	};

	const command = new ListObjectsV2Command(input);
	const url = await getSignedUrl(client, command, {
		expiresIn: 5000
	});

	return NextResponse.json(
		{
			data: url
		},
		{
			status: 201
		}
	);
}
