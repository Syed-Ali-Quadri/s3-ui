import {
	CopyObjectCommand,
	DeleteObjectCommand,
	ListObjectsV2Command,
	S3Client
} from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const client = new S3Client({
	region: "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID! as string,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! as string
	}
});

const bucketName = "s3-clone-project";

// Rename a single file
const renameFile = async (oldKey: string, newKey: string) => {
	try {
		// Copy the object to the new key
		const copyCommand = new CopyObjectCommand({
			Bucket: bucketName,
			Key: newKey,
			CopySource: `${bucketName}/${encodeURIComponent(oldKey)}`
		});
		await client.send(copyCommand);

		// Delete the original object
		const deleteCommand = new DeleteObjectCommand({
			Bucket: bucketName,
			Key: oldKey
		});
		await client.send(deleteCommand);

		console.log(`Renamed file: ${oldKey} -> ${newKey}`);
	} catch (error) {
		console.error(`Error renaming file ${oldKey}:`, error);
		throw error;
	}
};

// Rename a folder (all objects with the prefix)
const renameFolder = async (oldPrefix: string, newPrefix: string) => {
	try {
		// Ensure prefixes end with '/' for proper folder handling
		const normalizedOldPrefix = oldPrefix.endsWith("/")
			? oldPrefix
			: oldPrefix + "/";
		const normalizedNewPrefix = newPrefix.endsWith("/")
			? newPrefix
			: newPrefix + "/";

		console.log(`Renaming folder: ${normalizedOldPrefix} -> ${normalizedNewPrefix}`);

		// List all objects with the old prefix
		let continuationToken: string | undefined;
		const objectsToRename: string[] = [];

		do {
			const listCommand = new ListObjectsV2Command({
				Bucket: bucketName,
				Prefix: normalizedOldPrefix,
				ContinuationToken: continuationToken
			});

			const listResult = await client.send(listCommand);

			if (listResult.Contents) {
				objectsToRename.push(
					...listResult.Contents.map((obj) => obj.Key!)
				);
			}

			continuationToken = listResult.NextContinuationToken;
			console.log(`Continuation token: ${continuationToken}`);
		} while (continuationToken);

		if (objectsToRename.length === 0) {
			throw new Error(
				`No objects found with prefix: ${normalizedOldPrefix}`
			);
		}

		console.log(`Found ${objectsToRename.length} objects to rename`);

		// Copy all objects to new prefix
		const copyPromises = objectsToRename.map(async (oldKey) => {
			// Replace the old prefix with the new prefix
			const newKey = oldKey.replace(
				normalizedOldPrefix,
				normalizedNewPrefix
			);

		console.log(`Copy promises: ${copyPromises}`);

			const copyCommand = new CopyObjectCommand({
				Bucket: bucketName,
				Key: newKey,
				CopySource: `${bucketName}/${encodeURIComponent(oldKey)}`
			});

			return client.send(copyCommand);
		});

		await Promise.all(copyPromises);
		console.log("All objects copied successfully");

		// Delete all original objects
		const deletePromises = objectsToRename.map(async (oldKey) => {
			const deleteCommand = new DeleteObjectCommand({
				Bucket: bucketName,
				Key: oldKey
			});

			return client.send(deleteCommand);
		});

		await Promise.all(deletePromises);
		console.log("All original objects deleted successfully");

		return `Renamed folder: ${normalizedOldPrefix} -> ${normalizedNewPrefix} (${objectsToRename.length} objects)`;
	} catch (error) {
		console.error(`Error renaming folder ${oldPrefix}:`, error);
		throw error;
	}
};

// Main rename function that detects if it's a file or folder
const renameData = async (oldKey: string, newKey: string) => {
	try {
		// Check if this might be a folder by looking for objects with this prefix
		const listCommand = new ListObjectsV2Command({
			Bucket: bucketName,
			Prefix: oldKey.endsWith("/") ? oldKey : oldKey + "/",
			MaxKeys: 1
		});

		const listResult = await client.send(listCommand);
		const hasObjectsWithPrefix =
			listResult.Contents && listResult.Contents.length > 0;

		// Also check if there's an exact key match (single file)
		const exactFileCommand = new ListObjectsV2Command({
			Bucket: bucketName,
			Prefix: oldKey,
			MaxKeys: 1
		});

		const exactFileResult = await client.send(exactFileCommand);
		const hasExactMatch = exactFileResult.Contents?.some(
			(obj) => obj.Key === oldKey
		);

		if (hasExactMatch && !hasObjectsWithPrefix) {
			// It's a single file
			await renameFile(oldKey, newKey);
			return `File renamed: ${oldKey} -> ${newKey}`;
		} else if (hasObjectsWithPrefix) {
			// It's a folder (has objects with this prefix)
			const result = await renameFolder(oldKey, newKey);
			return result;
		} else {
			throw new Error(
				`No file or folder found with key/prefix: ${oldKey}`
			);
		}
	} catch (error) {
		console.error("Error in renameData:", error);
		throw error;
	}
};

export async function PUT(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

		const oldKey = searchParams.get("oldName");
		const newKey = searchParams.get("newName");
		const type = searchParams.get("type");

		if (!oldKey || !newKey) {
			return NextResponse.json(
				{ error: "Both oldKey and newKey are required" },
				{ status: 400 }
			);
		}

		let result;

		// Allow explicit type specification or auto-detect
		if (type === "folder") {
			result = await renameFolder(oldKey, newKey);
		} else if (type === "file") {
			result = await renameFile(oldKey, newKey);
		} else {
			// Auto-detect
			result = await renameData(oldKey, newKey);
		}

		return NextResponse.json(
			{
				message: "Rename operation completed successfully",
				data: result
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error in PUT handler:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to rename object/folder"
			},
			{ status: 500 }
		);
	}
}
