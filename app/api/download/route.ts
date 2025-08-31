import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
	region: "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
	}
});

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const key = searchParams.get('key');

		if (!key) {
			return NextResponse.json(
				{ error: 'File key is required' },
				{ status: 400 }
			);
		}

		const command = new GetObjectCommand({
			Bucket: "s3-clone-project",
			Key: key
		});

		const response = await client.send(command);
		
		if (!response.Body) {
			return NextResponse.json(
				{ error: 'File not found' },
				{ status: 404 }
			);
		}

		// Convert the stream to a buffer
		const chunks = [];
		const reader = response.Body.transformToWebStream().getReader();
		
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
		}

		// Combine all chunks into a single Uint8Array
		const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
		const combined = new Uint8Array(totalLength);
		let offset = 0;
		for (const chunk of chunks) {
			combined.set(chunk, offset);
			offset += chunk.length;
		}

		// Get the filename from the key
		const filename = key.split('/').pop() || 'download';
		
		// Determine content type based on file extension
		const getContentType = (filename: string): string => {
			const ext = filename.split('.').pop()?.toLowerCase();
			switch (ext) {
				case 'pdf': return 'application/pdf';
				case 'jpg':
				case 'jpeg': return 'image/jpeg';
				case 'png': return 'image/png';
				case 'gif': return 'image/gif';
				case 'txt': return 'text/plain';
				case 'json': return 'application/json';
				case 'csv': return 'text/csv';
				case 'xml': return 'application/xml';
				case 'zip': return 'application/zip';
				default: return 'application/octet-stream';
			}
		};

		const contentType = response.ContentType || getContentType(filename);

		return new NextResponse(combined, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Content-Disposition': `attachment; filename="${filename}"`,
				'Content-Length': combined.length.toString(),
			},
		});

	} catch (error) {
		console.error('Download error:', error);
		return NextResponse.json(
			{ error: 'Failed to download file' },
			{ status: 500 }
		);
	}
}
