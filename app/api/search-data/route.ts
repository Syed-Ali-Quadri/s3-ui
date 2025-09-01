import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const client = new S3Client({
	region: "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID! as string,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! as string
	}
});

async function fetchSearchData(query: string | null) {
	if (!query) return "Data not found...";

	const command = new ListObjectsV2Command({
		Bucket: "s3-clone-project",
		Prefix: query
	});

	const result = await client.send(command);
	return result.Contents ?? [];
}

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const pathName = searchParams.get("pathName");

	const searchData = await fetchSearchData(pathName);

	return NextResponse.json(
		{
			message: "Search data fetched successfully",
			data: searchData
		},
		{ status: 200 }
	);
}
