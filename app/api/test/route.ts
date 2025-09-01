import {
	CopyObjectCommand,
	DeleteObjectCommand,
	S3Client
} from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const client = new S3Client({
	region: "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID! as string,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! as string
	}
});

const renameData = async () => {
	const bucketName = "s3-clone-project";

	try {
		// Step 1: Copy the object to the new key
		const copyCommand = new CopyObjectCommand({
			Bucket: bucketName,
			Key: "Screenshot.png",
			CopySource: `${bucketName}/${encodeURIComponent(
				"Screenshot 2025-08-28 204031.png"
			)}` // Source must be URL-encoded
		});

		const copyResult = await client.send(copyCommand);
		console.log("Copy Result:", copyResult);

		// Step 2: Delete the original object
		const deleteCommand = new DeleteObjectCommand({
			Bucket: bucketName,
			Key: "Screenshot 2025-08-28 204031.png"
		});

		const deleteResult = await client.send(deleteCommand);
		console.log("Delete Result:", deleteResult);

		return "Data renamed successfully";
	} catch (error) {
		console.error("Error renaming data:", error);
		// If copy succeeded but delete failed, you might want to handle this case
		throw error;
	}
};

export async function PUT() {
	try {
		const result = await renameData();

		return NextResponse.json(
			{
				message: "Data renamed successfully",
				data: result
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error in PUT handler:", error);
		return NextResponse.json(
			{ error: "Failed to rename object" },
			{ status: 500 }
		);
	}
}
