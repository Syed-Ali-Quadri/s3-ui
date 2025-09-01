import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const client = new S3Client({
	region: "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID! as string,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! as string
	}
});

async function deleteData(query: string | null) {
	if (!query) return "Data not found...";

	const command = new DeleteObjectCommand({
		Bucket: "s3-clone-project",
		Key: query
	});

	const result = await client.send(command);
	return result;
}

export async function DELETE(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const pathName = searchParams.get("pathName");

	const deletedData = await deleteData(pathName);

	return NextResponse.json(
		{
			message: "Data deleted successfully",
			data: deletedData
		},
		{ status: 200 }
	);
}
