"use client";

import React from "react";

const AddFile = () => {
	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		// Grab the file from the input
		const fileInput = e.currentTarget.elements.namedItem(
			"file"
		) as HTMLInputElement;
		const file = fileInput.files?.[0];
		if (!file) {
			alert("Please select a file first!");
			return;
		}

		// Step 1: Ask backend for presigned URL
		const res = await fetch(
			`/api/presigned-url?fileName=${encodeURIComponent(
				file.name
			)}&fileType=${encodeURIComponent(file.type)}`
		);
		const { url } = await res.json();
        console.log(url)

		// Step 2: Upload file directly to S3
		await fetch(url, {
			method: "PUT",
			headers: {
				"Content-Type": file.type
			},
			body: file
		});

		console.log("✅ File uploaded successfully!");
	}

	return (
		<form
			className="w-full h-screen flex items-center justify-center gap-4"
			onSubmit={onSubmit}
		>
			<input
				className="border-2 border-black"
				type="file"
				name="file"
				id="file"
			/>
			<input
				className="border-2 rounded-md bg-green-500 text-white px-4 py-2 font-semibold cursor-pointer"
				type="submit"
				value="Upload"
			/>
		</form>
	);
};

export default AddFile;
