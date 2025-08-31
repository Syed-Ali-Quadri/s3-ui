"use client";

import React, { useState, useEffect } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface S3Object {
	Key?: string;
	LastModified?: string;
	Size?: number;
	StorageClass?: string;
	ETag?: string;
}

interface FolderStructure {
	[key: string]: {
		files: S3Object[];
		isFolder: boolean;
	};
}

interface ApiResponse {
	message: string;
	data: {
		Contents?: S3Object[];
		Name?: string;
	};
}

export default function Home() {
	const [folders, setFolders] = useState<FolderStructure>({});
	const [rootFiles, setRootFiles] = useState<S3Object[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [bucketName, setBucketName] = useState<string>("");
	const [darkMode, setDarkMode] = useState(false);

	const fetchFiles = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await fetch("/api/fetch-data");
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data: ApiResponse = await response.json();
			const allFiles = data.data.Contents || [];
			setBucketName(data.data.Name || "Unknown Bucket");

			// Organize files into folders and root files
			const folderStructure: FolderStructure = {};
			const rootFilesList: S3Object[] = [];

			allFiles.forEach((file) => {
				if (file.Key) {
					const pathParts = file.Key.split("/");
					if (pathParts.length === 1) {
						// Root level file
						rootFilesList.push(file);
					} else {
						const folderName = pathParts.slice(0, -1).join('/');
						if (!folderStructure[folderName]) {
							folderStructure[folderName] = {
								files: [],
								isFolder: true
							};
						}
						folderStructure[folderName].files.push(file);
					}
				}
			});

			setFolders(folderStructure);
			setRootFiles(rootFilesList);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			console.error("Error fetching files:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchFiles();
	}, []);

	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [darkMode]);

	const formatFileSize = (bytes?: number): string => {
		if (!bytes) return "0 B";
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
	};

	const formatDate = (dateString?: string): string => {
		if (!dateString) return "Unknown";
		return new Date(dateString).toLocaleDateString();
	};

	const downloadFile = async (fileKey: string) => {
		try {
			const response = await fetch(
				`/api/download?key=${encodeURIComponent(fileKey)}`
			);
			if (!response.ok) {
				throw new Error("Download failed");
			}
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.style.display = "none";
			a.href = url;
			a.download = fileKey.split("/").pop() || "download";
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error("Download error:", error);
			alert("Download failed. Please try again.");
		}
	};

	// Use file.Key or folderName as the key for proper re-render
	const renderFileCard = (file: S3Object) => (
		<div
			key={file.Key}
			className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center flex-1 min-w-0">
					<div className="flex-shrink-0">
						<svg
							className="w-5 h-5 text-gray-400 dark:text-gray-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
							role="img"
						>
							<title>File icon</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<div className="ml-3 flex-1 min-w-0">
						<p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
							{file.Key?.split("/").pop() || "Unnamed file"}
						</p>
						<p className="text-xs text-gray-500 dark:text-gray-400">
							{formatFileSize(file.Size)} • Modified:{" "}
							{formatDate(file.LastModified)}
						</p>
					</div>
				</div>
				<div className="flex items-center space-x-2 ml-4">
					{file.StorageClass && (
						<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
							{file.StorageClass}
						</span>
					)}
				</div>
			</div>
			<div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
				<div>
					<span className="font-medium">Full Path:</span> {file.Key}
				</div>
				<div>
					<span className="font-medium">ETag:</span>{" "}
					{file.ETag ? file.ETag.substring(1, 9) + "..." : "N/A"}
				</div>
			</div>
			<div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex space-x-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => downloadFile(file.Key || "")}
				>
					<svg
						className="w-4 h-4 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
						role="img"
					>
						<title>Download icon</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					Download
				</Button>
			</div>
		</div>
	);

	if (loading) {
		return (
			<div
				className={`min-h-screen ${
					darkMode ? "dark bg-gray-900" : "bg-gray-50"
				} flex items-center justify-center`}
			>
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p
						className={`mt-4 ${
							darkMode ? "text-gray-300" : "text-gray-600"
						}`}
					>
						Loading S3 files...
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div
				className={`min-h-screen ${
					darkMode ? "dark bg-gray-900" : "bg-gray-50"
				} flex items-center justify-center`}
			>
				<div
					className={`text-center ${
						darkMode ? "bg-gray-800" : "bg-white"
					} p-8 rounded-lg shadow-md max-w-md`}
				>
					<div className="text-red-500 text-5xl mb-4">⚠️</div>
					<h2
						className={`text-xl font-semibold ${
							darkMode ? "text-gray-100" : "text-gray-800"
						} mb-2`}
					>
						Error Loading Files
					</h2>
					<p
						className={`${
							darkMode ? "text-gray-300" : "text-gray-600"
						} mb-4`}
					>
						{error}
					</p>
					<Button onClick={fetchFiles} variant="default">
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`min-h-screen ${
				darkMode ? "dark bg-gray-900" : "bg-gray-50"
			}`}
		>
			{/* Header */}
			<div
				className={`${
					darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
				} shadow-sm border-b`}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1
								className={`text-3xl font-bold ${
									darkMode ? "text-gray-100" : "text-gray-900"
								}`}
							>
								S3 Bucket Viewer
							</h1>
							<p
								className={`${
									darkMode ? "text-gray-300" : "text-gray-600"
								} mt-1`}
							>
								Bucket:{" "}
								<span className="font-medium">
									{bucketName}
								</span>
							</p>
						</div>
						<div className="flex items-center space-x-4">
							{/* Dark Mode Toggle */}
							<Button
								variant="outline"
								size="sm"
								onClick={() => setDarkMode(!darkMode)}
								className="flex items-center"
							>
								{darkMode ? (
									<svg
										className="w-4 h-4 mr-2"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
										role="img"
									>
										<title>Light mode icon</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
										/>
									</svg>
								) : (
									<svg
										className="w-4 h-4 mr-2"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
										role="img"
									>
										<title>Dark mode icon</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
										/>
									</svg>
								)}
								{darkMode ? "Light" : "Dark"}
							</Button>
							{/* Refresh Button */}
							<Button
								onClick={fetchFiles}
								className="flex items-center"
							>
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
									role="img"
								>
									<title>Refresh icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								Refresh
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{rootFiles.length === 0 && Object.keys(folders).length === 0 ? (
					<div className="text-center py-12">
						<div
							className={`${
								darkMode ? "text-gray-500" : "text-gray-400"
							} text-6xl mb-4`}
						>
							📁
						</div>
						<h3
							className={`text-lg font-medium ${
								darkMode ? "text-gray-100" : "text-gray-900"
							} mb-2`}
						>
							No files found
						</h3>
						<p
							className={`${
								darkMode ? "text-gray-300" : "text-gray-600"
							}`}
						>
							This bucket appears to be empty.
						</p>
					</div>
				) : (
					<div className="space-y-6">
						{/* Root Files Section (Always visible, no accordion) */}
						{rootFiles.length > 0 && (
							<Card
								className={`overflow-hidden ${
									darkMode
										? "bg-gray-800 border-gray-700"
										: ""
								}`}
							>
								<CardHeader>
									<CardTitle
										className={`flex items-center justify-between ${
											darkMode ? "text-gray-100" : ""
										}`}
									>
										<span>
											Root Files ({rootFiles.length})
										</span>
										<div
											className={`text-sm ${
												darkMode
													? "text-gray-400"
													: "text-gray-500"
											} font-normal`}
										>
											{formatFileSize(
												rootFiles.reduce(
													(acc, file) =>
														acc + (file.Size || 0),
													0
												)
											)}
										</div>
									</CardTitle>
								</CardHeader>
								<CardContent className="p-6">
									<div className="space-y-3">
										{rootFiles.map((file) =>
											renderFileCard(file)
										)}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Folders Section (With Accordion) */}
						{Object.keys(folders).length > 0 && (
							<Card
								className={`overflow-hidden ${
									darkMode
										? "bg-gray-800 border-gray-700"
										: ""
								}`}
							>
								<CardHeader>
									<CardTitle
										className={`flex items-center justify-between ${
											darkMode ? "text-gray-100" : ""
										}`}
									>
										<span>
											Folders (
											{Object.keys(folders).length})
										</span>
										<div
											className={`text-sm ${
												darkMode
													? "text-gray-400"
													: "text-gray-500"
											} font-normal`}
										>
											{Object.values(folders).reduce(
												(acc, folder) =>
													acc + folder.files.length,
												0
											)}{" "}
											files
										</div>
									</CardTitle>
								</CardHeader>
								<CardContent className="p-0">
									<Accordion
										type="single"
										collapsible
										className="w-full"
									>
										{Object.entries(folders).map(
											([folderName, folderData]) => (
												<AccordionItem
													key={folderName}
													value={`folder-${folderName}`}
													className={`border-b ${
														darkMode
															? "border-gray-700"
															: ""
													}`}
												>
													<AccordionTrigger
														className={`px-6 py-4 hover:no-underline ${
															darkMode
																? "hover:bg-gray-700"
																: "hover:bg-gray-50"
														}`}
													>
														<div className="flex items-center justify-between w-full mr-4">
															<div className="flex items-center flex-1 min-w-0">
																<div className="flex-shrink-0">
																	<svg
																		className="w-6 h-6 text-blue-500"
																		fill="none"
																		stroke="currentColor"
																		viewBox="0 0 24 24"
																		aria-hidden="true"
																		role="img"
																	>
																		<title>
																			Folder
																			icon
																		</title>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={
																				2
																			}
																			d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
																		/>
																	</svg>
																</div>
																<div className="ml-4 flex-1 min-w-0 text-left">
																	<p
																		className={`text-sm font-medium ${
																			darkMode
																				? "text-gray-100"
																				: "text-gray-900"
																		} truncate`}
																	>
																		{
																			folderName
																		}
																	</p>
																	<p
																		className={`text-xs ${
																			darkMode
																				? "text-gray-400"
																				: "text-gray-500"
																		}`}
																	>
																		{
																			folderData
																				.files
																				.length
																		}{" "}
																		files
																	</p>
																</div>
															</div>
															<div className="flex items-center space-x-2">
																<span
																	className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
																		darkMode
																			? "bg-blue-900 text-blue-300"
																			: "bg-blue-100 text-blue-800"
																	}`}
																>
																	Folder
																</span>
															</div>
														</div>
													</AccordionTrigger>
													<AccordionContent className="px-6 pb-4">
														<div className="space-y-3">
															{folderData.files.map(
																(file) =>
																	renderFileCard(
																		file
																	)
															)}
														</div>
													</AccordionContent>
												</AccordionItem>
											)
										)}
									</Accordion>
								</CardContent>
							</Card>
						)}
					</div>
				)}
			</div>
		</div>
	);
}