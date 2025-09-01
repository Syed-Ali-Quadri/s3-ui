import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

const client = new S3Client({
	region: "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
	}
});

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const fileName = searchParams.get("fileName")!;
	const filePath = searchParams.get("filePath") || "";
	const fileType = searchParams.get("fileType")!;

	const command = new PutObjectCommand({
		Bucket: "s3-clone-project",
		Key: `${filePath}/${fileName}`,
		ContentType: fileType
	});

	const url = await getSignedUrl(client, command, { expiresIn: 3600 });

	return NextResponse.json({ url }, { status: 200 });
}
