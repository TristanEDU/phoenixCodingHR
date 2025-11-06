// DocumentManager - Enhanced document management with versioning, search, and collaboration
// Handles advanced document operations, search, approval workflows, and user feedback

export class DocumentManager {
	constructor(authSystem, permissionsManager) {
		this.authSystem = authSystem;
		this.permissionsManager = permissionsManager;
		this.app = null; // Will be set by main app

		// Document storage keys
		this.documentsKey = "study-hall-documents";
		this.documentVersionsKey = "study-hall-document-versions";
		this.documentFeedbackKey = "study-hall-document-feedback";
		this.documentApprovalsKey = "study-hall-document-approvals";
		this.documentTemplatesKey = "study-hall-document-templates";
		this.documentSearchIndexKey = "study-hall-document-search-index";

		// Initialize data
		this.documents = this.loadDocuments();
		this.documentVersions = this.loadDocumentVersions();
		this.documentFeedback = this.loadDocumentFeedback();
		this.documentApprovals = this.loadDocumentApprovals();
		this.documentTemplates = this.loadDocumentTemplates();
		this.searchIndex = this.loadSearchIndex();

		// Search and filter state
		this.currentSearchQuery = "";
		this.currentFilters = {
			category: "all",
			author: "all",
			status: "all",
			dateRange: "all",
			tags: [],
		};
		this.sortBy = "lastModified";
		this.sortOrder = "desc";

		// Initialize search indexing
		this.rebuildSearchIndex();
	}

	setApp(app) {
		this.app = app;
	}

	// Data loading methods
	loadDocuments() {
		try {
			const saved = localStorage.getItem(this.documentsKey);
			return saved ? JSON.parse(saved) : this.getDefaultDocuments();
		} catch (error) {
			console.error("Error loading documents:", error);
			return this.getDefaultDocuments();
		}
	}

	loadDocumentVersions() {
		try {
			const saved = localStorage.getItem(this.documentVersionsKey);
			return saved ? JSON.parse(saved) : {};
		} catch (error) {
			return {};
		}
	}

	loadDocumentFeedback() {
		try {
			const saved = localStorage.getItem(this.documentFeedbackKey);
			return saved ? JSON.parse(saved) : {};
		} catch (error) {
			return {};
		}
	}

	loadDocumentApprovals() {
		try {
			const saved = localStorage.getItem(this.documentApprovalsKey);
			return saved ? JSON.parse(saved) : {};
		} catch (error) {
			return {};
		}
	}

	loadDocumentTemplates() {
		try {
			const saved = localStorage.getItem(this.documentTemplatesKey);
			return saved ? JSON.parse(saved) : this.getDefaultTemplates();
		} catch (error) {
			return this.getDefaultTemplates();
		}
	}

	loadSearchIndex() {
		try {
			const saved = localStorage.getItem(this.documentSearchIndexKey);
			return saved ? JSON.parse(saved) : {};
		} catch (error) {
			return {};
		}
	}

	// Save methods
	saveDocuments() {
		localStorage.setItem(this.documentsKey, JSON.stringify(this.documents));
		this.rebuildSearchIndex();
	}

	saveDocumentVersions() {
		localStorage.setItem(
			this.documentVersionsKey,
			JSON.stringify(this.documentVersions)
		);
	}

	saveDocumentFeedback() {
		localStorage.setItem(
			this.documentFeedbackKey,
			JSON.stringify(this.documentFeedback)
		);
	}

	saveDocumentApprovals() {
		localStorage.setItem(
			this.documentApprovalsKey,
			JSON.stringify(this.documentApprovals)
		);
	}

	saveDocumentTemplates() {
		localStorage.setItem(
			this.documentTemplatesKey,
			JSON.stringify(this.documentTemplates)
		);
	}

	saveSearchIndex() {
		localStorage.setItem(
			this.documentSearchIndexKey,
			JSON.stringify(this.searchIndex)
		);
	}

	// Default data
	getDefaultDocuments() {
		return [
			{
				id: 1,
				title: "Employee Handbook",
				description:
					"Comprehensive guide for all employees covering policies, procedures, and company culture.",
				content:
					"Welcome to The Study Hall! This handbook contains everything you need to know about working here...",
				author: "HR Team",
				authorId: "admin@studyhall.com",
				category: "hr",
				type: "handbook",
				icon: "📖",
				status: "published",
				version: "2.1",
				tags: ["hr", "policies", "onboarding"],
				dateCreated: new Date().toISOString(),
				lastModified: new Date().toISOString(),
				lastModifiedBy: "admin@studyhall.com",
				approvalStatus: "approved",
				approvedBy: "admin@studyhall.com",
				approvedDate: new Date().toISOString(),
				viewCount: 145,
				downloadCount: 89,
				averageRating: 4.6,
				requiresAcknowledgment: true,
				isPublic: true,
				collaborators: ["admin@studyhall.com"],
				attachments: [],
			},
			{
				id: 2,
				title: "Remote Work Guidelines",
				description:
					"Best practices and policies for remote work arrangements.",
				content: "Remote work has become an integral part of our workplace...",
				author: "Operations Team",
				authorId: "ops@studyhall.com",
				category: "operations",
				type: "guideline",
				icon: "🏠",
				status: "published",
				version: "1.3",
				tags: ["remote", "work", "guidelines"],
				dateCreated: new Date(
					Date.now() - 30 * 24 * 60 * 60 * 1000
				).toISOString(),
				lastModified: new Date(
					Date.now() - 5 * 24 * 60 * 60 * 1000
				).toISOString(),
				lastModifiedBy: "ops@studyhall.com",
				approvalStatus: "approved",
				approvedBy: "admin@studyhall.com",
				approvedDate: new Date(
					Date.now() - 3 * 24 * 60 * 60 * 1000
				).toISOString(),
				viewCount: 78,
				downloadCount: 34,
				averageRating: 4.2,
				requiresAcknowledgment: false,
				isPublic: true,
				collaborators: ["ops@studyhall.com"],
				attachments: [],
			},
		];
	}

	getDefaultTemplates() {
		return [
			{
				id: 1,
				name: "Policy Document",
				description: "Standard template for creating company policies",
				category: "policy",
				icon: "📋",
				content: `# Policy Title

## Purpose
[Describe the purpose of this policy]

## Scope
[Define who this policy applies to]

## Policy Statement
[Main policy content]

## Procedures
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Compliance
[Compliance requirements and consequences]

## Review Date
[When this policy will be reviewed]

---
*This document was created using the Policy Document template.*`,
				tags: ["policy", "template"],
				isActive: true,
				createdBy: "admin@studyhall.com",
				dateCreated: new Date().toISOString(),
			},
			{
				id: 2,
				name: "Process Documentation",
				description: "Template for documenting business processes",
				category: "process",
				icon: "⚙️",
				content: `# Process Name

## Overview
[Brief description of the process]

## Prerequisites
- [Requirement 1]
- [Requirement 2]

## Steps
1. **Step 1**: [Description]
   - [Detail 1]
   - [Detail 2]

2. **Step 2**: [Description]
   - [Detail 1]
   - [Detail 2]

## Troubleshooting
| Issue | Solution |
|-------|----------|
| [Common issue] | [Solution] |

## Related Documents
- [Document 1]
- [Document 2]

---
*This document was created using the Process Documentation template.*`,
				tags: ["process", "template"],
				isActive: true,
				createdBy: "admin@studyhall.com",
				dateCreated: new Date().toISOString(),
			},
		];
	}

	// Enhanced search functionality
	rebuildSearchIndex() {
		this.searchIndex = {};

		this.documents.forEach((doc) => {
			const searchableText = [
				doc.title,
				doc.description,
				doc.content,
				doc.author,
				doc.category,
				doc.type,
				...doc.tags,
			]
				.join(" ")
				.toLowerCase();

			// Simple word indexing
			const words = searchableText.split(/\s+/);
			words.forEach((word) => {
				if (word.length > 2) {
					// Ignore very short words
					if (!this.searchIndex[word]) {
						this.searchIndex[word] = [];
					}
					if (!this.searchIndex[word].includes(doc.id)) {
						this.searchIndex[word].push(doc.id);
					}
				}
			});
		});

		this.saveSearchIndex();
	}

	searchDocuments(query) {
		if (!query || query.trim().length === 0) {
			return this.documents;
		}

		const searchTerms = query.toLowerCase().split(/\s+/);
		const matchingDocIds = new Set();

		searchTerms.forEach((term) => {
			// Exact matches
			if (this.searchIndex[term]) {
				this.searchIndex[term].forEach((docId) => matchingDocIds.add(docId));
			}

			// Partial matches
			Object.keys(this.searchIndex).forEach((indexedTerm) => {
				if (indexedTerm.includes(term) || term.includes(indexedTerm)) {
					this.searchIndex[indexedTerm].forEach((docId) =>
						matchingDocIds.add(docId)
					);
				}
			});
		});

		// Return documents sorted by relevance
		const matchingDocs = this.documents.filter((doc) =>
			matchingDocIds.has(doc.id)
		);
		return this.sortDocuments(matchingDocs);
	}

	// Advanced filtering
	filterDocuments(docs, filters) {
		return docs.filter((doc) => {
			// Category filter
			if (
				filters.category &&
				filters.category !== "all" &&
				doc.category !== filters.category
			) {
				return false;
			}

			// Author filter
			if (
				filters.author &&
				filters.author !== "all" &&
				doc.authorId !== filters.author
			) {
				return false;
			}

			// Status filter
			if (
				filters.status &&
				filters.status !== "all" &&
				doc.status !== filters.status
			) {
				return false;
			}

			// Date range filter
			if (filters.dateRange && filters.dateRange !== "all") {
				const docDate = new Date(doc.lastModified);
				const now = new Date();
				let cutoffDate;

				switch (filters.dateRange) {
					case "today":
						cutoffDate = new Date(
							now.getFullYear(),
							now.getMonth(),
							now.getDate()
						);
						break;
					case "week":
						cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
						break;
					case "month":
						cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
						break;
					case "quarter":
						cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
						break;
					default:
						cutoffDate = new Date(0);
				}

				if (docDate < cutoffDate) {
					return false;
				}
			}

			// Tags filter
			if (filters.tags && filters.tags.length > 0) {
				const hasMatchingTag = filters.tags.some((tag) =>
					doc.tags.includes(tag)
				);
				if (!hasMatchingTag) {
					return false;
				}
			}

			return true;
		});
	}

	// Sorting
	sortDocuments(docs) {
		return docs.sort((a, b) => {
			let aValue, bValue;

			switch (this.sortBy) {
				case "title":
					aValue = a.title.toLowerCase();
					bValue = b.title.toLowerCase();
					break;
				case "author":
					aValue = a.author.toLowerCase();
					bValue = b.author.toLowerCase();
					break;
				case "dateCreated":
					aValue = new Date(a.dateCreated);
					bValue = new Date(b.dateCreated);
					break;
				case "lastModified":
					aValue = new Date(a.lastModified);
					bValue = new Date(b.lastModified);
					break;
				case "viewCount":
					aValue = a.viewCount || 0;
					bValue = b.viewCount || 0;
					break;
				case "rating":
					aValue = a.averageRating || 0;
					bValue = b.averageRating || 0;
					break;
				default:
					aValue = new Date(a.lastModified);
					bValue = new Date(b.lastModified);
			}

			if (this.sortOrder === "asc") {
				return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			} else {
				return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
			}
		});
	}

	// Get filtered and sorted documents
	getDocuments(searchQuery = "", filters = null) {
		this.currentSearchQuery = searchQuery;
		if (filters) {
			this.currentFilters = { ...this.currentFilters, ...filters };
		}

		// Start with search results or all documents
		let docs = searchQuery ? this.searchDocuments(searchQuery) : this.documents;

		// Apply filters
		docs = this.filterDocuments(docs, this.currentFilters);

		// Apply sorting
		docs = this.sortDocuments(docs);

		return docs;
	}

	// Document CRUD operations with versioning
	createDocument(documentData) {
		const currentUser = this.authSystem.getCurrentUser();
		if (!currentUser) {
			throw new Error("User must be logged in to create documents");
		}

		const newId = Math.max(...this.documents.map((d) => d.id), 0) + 1;
		const now = new Date().toISOString();

		const newDocument = {
			id: newId,
			title: documentData.title,
			description: documentData.description || "",
			content: documentData.content || "",
			author: currentUser.name,
			authorId: currentUser.email,
			category: documentData.category || "general",
			type: documentData.type || "document",
			icon: documentData.icon || "📄",
			status: documentData.requiresApproval ? "pending_approval" : "published",
			version: "1.0",
			tags: documentData.tags || [],
			dateCreated: now,
			lastModified: now,
			lastModifiedBy: currentUser.email,
			approvalStatus: documentData.requiresApproval ? "pending" : "approved",
			approvedBy: documentData.requiresApproval ? null : currentUser.email,
			approvedDate: documentData.requiresApproval ? null : now,
			viewCount: 0,
			downloadCount: 0,
			averageRating: 0,
			requiresAcknowledgment: documentData.requiresAcknowledgment || false,
			isPublic: documentData.isPublic !== false,
			collaborators: [currentUser.email],
			attachments: documentData.attachments || [],
		};

		this.documents.push(newDocument);
		this.saveDocuments();

		// Create initial version
		this.createDocumentVersion(newId, newDocument, "Initial version");

		return newDocument;
	}

	updateDocument(id, updates) {
		const docIndex = this.documents.findIndex((d) => d.id === id);
		if (docIndex === -1) {
			throw new Error("Document not found");
		}

		const currentUser = this.authSystem.getCurrentUser();
		if (!currentUser) {
			throw new Error("User must be logged in to update documents");
		}

		const document = this.documents[docIndex];

		// Check permissions
		if (!this.canEditDocument(document, currentUser)) {
			throw new Error("You don't have permission to edit this document");
		}

		// Create version before updating
		this.createDocumentVersion(
			id,
			document,
			updates.versionNote || "Document updated"
		);

		// Update document
		const updatedDocument = {
			...document,
			...updates,
			lastModified: new Date().toISOString(),
			lastModifiedBy: currentUser.email,
			version: this.incrementVersion(document.version),
		};

		// If content changed and requires approval, set to pending
		if (
			updates.content &&
			document.requiresApproval &&
			!this.permissionsManager.hasPermission("canApproveDocuments")
		) {
			updatedDocument.status = "pending_approval";
			updatedDocument.approvalStatus = "pending";
		}

		this.documents[docIndex] = updatedDocument;
		this.saveDocuments();

		return updatedDocument;
	}

	deleteDocument(id) {
		const docIndex = this.documents.findIndex((d) => d.id === id);
		if (docIndex === -1) {
			throw new Error("Document not found");
		}

		const currentUser = this.authSystem.getCurrentUser();
		if (!currentUser) {
			throw new Error("User must be logged in to delete documents");
		}

		const document = this.documents[docIndex];

		// Check permissions
		if (!this.canDeleteDocument(document, currentUser)) {
			throw new Error("You don't have permission to delete this document");
		}

		// Remove document and all associated data
		this.documents.splice(docIndex, 1);
		delete this.documentVersions[id];
		delete this.documentFeedback[id];
		delete this.documentApprovals[id];

		this.saveDocuments();
		this.saveDocumentVersions();
		this.saveDocumentFeedback();
		this.saveDocumentApprovals();

		return true;
	}

	// Version management
	createDocumentVersion(documentId, documentData, note) {
		if (!this.documentVersions[documentId]) {
			this.documentVersions[documentId] = [];
		}

		const version = {
			id: this.documentVersions[documentId].length + 1,
			documentId: documentId,
			version: documentData.version,
			title: documentData.title,
			content: documentData.content,
			author: documentData.lastModifiedBy || documentData.authorId,
			dateCreated: new Date().toISOString(),
			note: note || "Version created",
			fileSize: new Blob([documentData.content]).size,
		};

		this.documentVersions[documentId].push(version);
		this.saveDocumentVersions();

		return version;
	}

	getDocumentVersions(documentId) {
		return this.documentVersions[documentId] || [];
	}

	restoreDocumentVersion(documentId, versionId) {
		const versions = this.getDocumentVersions(documentId);
		const version = versions.find((v) => v.id === versionId);

		if (!version) {
			throw new Error("Version not found");
		}

		const currentUser = this.authSystem.getCurrentUser();
		if (!currentUser) {
			throw new Error("User must be logged in");
		}

		// Update document with version content
		return this.updateDocument(documentId, {
			title: version.title,
			content: version.content,
			versionNote: `Restored from version ${version.version}`,
		});
	}

	incrementVersion(currentVersion) {
		const parts = currentVersion.split(".");
		const major = parseInt(parts[0]);
		const minor = parseInt(parts[1] || 0);

		return `${major}.${minor + 1}`;
	}

	// Permission checking
	canEditDocument(document, user) {
		// Document author can always edit
		if (document.authorId === user.email) return true;

		// Collaborators can edit
		if (document.collaborators.includes(user.email)) return true;

		// Users with edit permissions can edit
		if (this.permissionsManager.hasPermission("canEditAllDocuments"))
			return true;

		return false;
	}

	canDeleteDocument(document, user) {
		// Document author can delete
		if (document.authorId === user.email) return true;

		// Users with delete permissions can delete
		if (this.permissionsManager.hasPermission("canDeleteDocuments"))
			return true;

		return false;
	}

	canApproveDocument(document, user) {
		return this.permissionsManager.hasPermission("canApproveDocuments");
	}

	// Document approval workflow
	submitForApproval(documentId) {
		const docIndex = this.documents.findIndex((d) => d.id === documentId);
		if (docIndex === -1) {
			throw new Error("Document not found");
		}

		const currentUser = this.authSystem.getCurrentUser();
		if (!currentUser) {
			throw new Error("User must be logged in");
		}

		const document = this.documents[docIndex];

		if (!this.canEditDocument(document, currentUser)) {
			throw new Error(
				"You don't have permission to submit this document for approval"
			);
		}

		this.documents[docIndex] = {
			...document,
			status: "pending_approval",
			approvalStatus: "pending",
			lastModified: new Date().toISOString(),
		};

		this.saveDocuments();
		return this.documents[docIndex];
	}

	approveDocument(documentId, approved = true, comments = "") {
		const docIndex = this.documents.findIndex((d) => d.id === documentId);
		if (docIndex === -1) {
			throw new Error("Document not found");
		}

		const currentUser = this.authSystem.getCurrentUser();
		if (!currentUser) {
			throw new Error("User must be logged in");
		}

		if (!this.canApproveDocument(null, currentUser)) {
			throw new Error("You don't have permission to approve documents");
		}

		const now = new Date().toISOString();
		this.documents[docIndex] = {
			...this.documents[docIndex],
			status: approved ? "published" : "rejected",
			approvalStatus: approved ? "approved" : "rejected",
			approvedBy: currentUser.email,
			approvedDate: now,
			lastModified: now,
		};

		// Record approval decision
		if (!this.documentApprovals[documentId]) {
			this.documentApprovals[documentId] = [];
		}

		this.documentApprovals[documentId].push({
			id: this.documentApprovals[documentId].length + 1,
			documentId: documentId,
			approver: currentUser.email,
			approved: approved,
			comments: comments,
			dateApproved: now,
		});

		this.saveDocuments();
		this.saveDocumentApprovals();

		return this.documents[docIndex];
	}

	// Feedback and rating system
	addDocumentFeedback(documentId, feedback) {
		const currentUser = this.authSystem.getCurrentUser();
		if (!currentUser) {
			throw new Error("User must be logged in to provide feedback");
		}

		if (!this.documentFeedback[documentId]) {
			this.documentFeedback[documentId] = [];
		}

		const newFeedback = {
			id: this.documentFeedback[documentId].length + 1,
			documentId: documentId,
			userId: currentUser.email,
			userName: currentUser.name,
			rating: feedback.rating || null,
			comment: feedback.comment || "",
			isHelpful: feedback.isHelpful || null,
			dateCreated: new Date().toISOString(),
		};

		this.documentFeedback[documentId].push(newFeedback);
		this.saveDocumentFeedback();

		// Update document average rating
		this.updateDocumentRating(documentId);

		return newFeedback;
	}

	updateDocumentRating(documentId) {
		const feedback = this.documentFeedback[documentId] || [];
		const ratings = feedback
			.filter((f) => f.rating !== null)
			.map((f) => f.rating);

		if (ratings.length > 0) {
			const averageRating =
				ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

			const docIndex = this.documents.findIndex((d) => d.id === documentId);
			if (docIndex !== -1) {
				this.documents[docIndex].averageRating =
					Math.round(averageRating * 10) / 10;
				this.saveDocuments();
			}
		}
	}

	getDocumentFeedback(documentId) {
		return this.documentFeedback[documentId] || [];
	}

	// Document analytics
	recordDocumentView(documentId) {
		const docIndex = this.documents.findIndex((d) => d.id === documentId);
		if (docIndex !== -1) {
			this.documents[docIndex].viewCount =
				(this.documents[docIndex].viewCount || 0) + 1;
			this.saveDocuments();
		}
	}

	recordDocumentDownload(documentId) {
		const docIndex = this.documents.findIndex((d) => d.id === documentId);
		if (docIndex !== -1) {
			this.documents[docIndex].downloadCount =
				(this.documents[docIndex].downloadCount || 0) + 1;
			this.saveDocuments();
		}
	}

	// Template management
	createDocumentFromTemplate(templateId, documentData) {
		const template = this.documentTemplates.find((t) => t.id === templateId);
		if (!template) {
			throw new Error("Template not found");
		}

		const documentWithTemplate = {
			...documentData,
			content: template.content,
			type: template.category,
			tags: [...(documentData.tags || []), ...template.tags],
		};

		return this.createDocument(documentWithTemplate);
	}

	getDocumentTemplates(category = null) {
		let templates = this.documentTemplates.filter((t) => t.isActive);
		if (category) {
			templates = templates.filter((t) => t.category === category);
		}
		return templates;
	}

	// Utility methods
	getDocumentById(id) {
		return this.documents.find((d) => d.id === id);
	}

	getDocumentsByCategory(category) {
		return this.documents.filter((d) => d.category === category);
	}

	getDocumentsByAuthor(authorId) {
		return this.documents.filter((d) => d.authorId === authorId);
	}

	getDocumentsByStatus(status) {
		return this.documents.filter((d) => d.status === status);
	}

	getPendingApprovals() {
		return this.documents.filter((d) => d.approvalStatus === "pending");
	}

	getPopularDocuments(limit = 10) {
		return this.documents
			.filter((d) => d.status === "published")
			.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
			.slice(0, limit);
	}

	getRecentDocuments(limit = 10) {
		return this.documents
			.filter((d) => d.status === "published")
			.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
			.slice(0, limit);
	}

	getAllTags() {
		const allTags = new Set();
		this.documents.forEach((doc) => {
			doc.tags.forEach((tag) => allTags.add(tag));
		});
		return Array.from(allTags).sort();
	}

	getAllAuthors() {
		const authors = new Set();
		this.documents.forEach((doc) => {
			authors.add(doc.authorId);
		});
		return Array.from(authors);
	}

	getDocumentStats() {
		const total = this.documents.length;
		const published = this.documents.filter(
			(d) => d.status === "published"
		).length;
		const pending = this.documents.filter(
			(d) => d.approvalStatus === "pending"
		).length;
		const totalViews = this.documents.reduce(
			(sum, doc) => sum + (doc.viewCount || 0),
			0
		);
		const totalDownloads = this.documents.reduce(
			(sum, doc) => sum + (doc.downloadCount || 0),
			0
		);

		return {
			total,
			published,
			pending,
			totalViews,
			totalDownloads,
			averageRating:
				this.documents.reduce((sum, doc) => sum + (doc.averageRating || 0), 0) /
				total,
		};
	}

	// ========================
	// FILE IMPORT & CREATION
	// ========================

	/**
	 * Import file from user's computer
	 * @param {File} file - File object from input
	 * @param {Object} metadata - Additional document metadata
	 * @returns {Promise<Object>} - Created document object
	 */
	async importFile(file, metadata = {}) {
		return new Promise((resolve, reject) => {
			try {
				const currentUser = this.authSystem.getCurrentUser();
				if (!currentUser) {
					reject(new Error("User not authenticated"));
					return;
				}

				// Validate file
				const validation = this.validateFile(file);
				if (!validation.valid) {
					reject(new Error(validation.error));
					return;
				}

				const reader = new FileReader();

				reader.onload = (e) => {
					try {
						const fileContent = e.target.result;
						const document = this.createDocumentFromFile(
							file,
							fileContent,
							metadata,
							currentUser
						);

						// Add to documents array
						this.documents.push(document);
						this.saveDocuments();

						// Update search index
						this.addToSearchIndex(document);

						console.log("File imported successfully:", document.title);
						resolve(document);
					} catch (error) {
						reject(error);
					}
				};

				reader.onerror = () => {
					reject(new Error("Failed to read file"));
				};

				// Read file based on type
				if (this.isTextFile(file)) {
					reader.readAsText(file);
				} else {
					reader.readAsDataURL(file);
				}
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Create a new document from scratch
	 * @param {Object} documentData - Document information
	 * @returns {Object} - Created document object
	 */
	createNewDocument(documentData) {
		try {
			const currentUser = this.authSystem.getCurrentUser();
			if (!currentUser) {
				throw new Error("User not authenticated");
			}

			const document = {
				id: this.generateDocumentId(),
				title: documentData.title || "Untitled Document",
				content: documentData.content || "",
				type: documentData.type || "document",
				category: documentData.category || "general",

				// File information
				fileName:
					documentData.fileName || `${documentData.title || "untitled"}.html`,
				fileSize: new Blob([documentData.content || ""]).size,
				mimeType: "text/html",
				isImported: false,
				isCustomCreated: true,

				// Metadata
				author: currentUser.name,
				authorEmail: currentUser.email,
				createdAt: new Date().toISOString(),
				lastModified: new Date().toISOString(),
				version: 1,

				// Status and access
				status: documentData.status || "draft",
				visibility: documentData.visibility || "private",

				// Content metadata
				description: documentData.description || "",
				tags: documentData.tags || [],
				department: documentData.department || currentUser.department || "",

				// Statistics
				viewCount: 0,
				downloadCount: 0,
				averageRating: 0,
				ratingCount: 0,

				// Collaboration
				allowComments: documentData.allowComments !== false,
				requiresApproval: documentData.requiresApproval || false,
				approvedBy: null,
				approvedAt: null,

				// Revision tracking
				lastEditedBy: currentUser.email,
				editHistory: [
					{
						timestamp: new Date().toISOString(),
						user: currentUser.email,
						action: "created",
						version: 1,
					},
				],
			};

			// Add to documents array
			this.documents.push(document);
			this.saveDocuments();

			// Update search index
			this.addToSearchIndex(document);

			console.log("New document created:", document.title);
			return document;
		} catch (error) {
			console.error("Error creating document:", error);
			throw error;
		}
	}

	/**
	 * Update existing document content
	 * @param {string} documentId - Document ID
	 * @param {Object} updates - Updates to apply
	 * @returns {Object} - Updated document
	 */
	updateDocumentContent(documentId, updates) {
		try {
			const docIndex = this.documents.findIndex((doc) => doc.id === documentId);
			if (docIndex === -1) {
				throw new Error("Document not found");
			}

			const currentUser = this.authSystem.getCurrentUser();
			if (!currentUser) {
				throw new Error("User not authenticated");
			}

			const document = this.documents[docIndex];

			// Check permissions
			if (!this.canEditDocument(document, currentUser)) {
				throw new Error("Permission denied");
			}

			// Create version backup if content changed
			if (updates.content && updates.content !== document.content) {
				this.createDocumentVersion(document);
			}

			// Apply updates
			const updatedDocument = {
				...document,
				...updates,
				lastModified: new Date().toISOString(),
				lastEditedBy: currentUser.email,
				version: document.version + (updates.content ? 1 : 0),
			};

			// Update file size if content changed
			if (updates.content) {
				updatedDocument.fileSize = new Blob([updates.content]).size;
			}

			// Add to edit history
			updatedDocument.editHistory = [
				...document.editHistory,
				{
					timestamp: new Date().toISOString(),
					user: currentUser.email,
					action: updates.content ? "content_updated" : "metadata_updated",
					version: updatedDocument.version,
				},
			];

			this.documents[docIndex] = updatedDocument;
			this.saveDocuments();

			// Update search index
			this.updateSearchIndex(updatedDocument);

			console.log("Document updated:", updatedDocument.title);
			return updatedDocument;
		} catch (error) {
			console.error("Error updating document:", error);
			throw error;
		}
	}

	/**
	 * Duplicate an existing document
	 * @param {string} documentId - Source document ID
	 * @param {Object} overrides - Properties to override
	 * @returns {Object} - New document object
	 */
	duplicateDocument(documentId, overrides = {}) {
		try {
			const sourceDoc = this.documents.find((doc) => doc.id === documentId);
			if (!sourceDoc) {
				throw new Error("Source document not found");
			}

			const currentUser = this.authSystem.getCurrentUser();
			if (!currentUser) {
				throw new Error("User not authenticated");
			}

			const duplicatedDoc = {
				...sourceDoc,
				id: this.generateDocumentId(),
				title: overrides.title || `${sourceDoc.title} (Copy)`,
				fileName:
					overrides.fileName ||
					`${sourceDoc.title}_copy.${this.getFileExtension(
						sourceDoc.fileName
					)}`,
				author: currentUser.name,
				authorEmail: currentUser.email,
				createdAt: new Date().toISOString(),
				lastModified: new Date().toISOString(),
				version: 1,
				status: "draft",

				// Reset statistics
				viewCount: 0,
				downloadCount: 0,
				averageRating: 0,
				ratingCount: 0,

				// Reset approval status
				approvedBy: null,
				approvedAt: null,

				// Reset edit history
				editHistory: [
					{
						timestamp: new Date().toISOString(),
						user: currentUser.email,
						action: "duplicated",
						version: 1,
						sourceDocumentId: documentId,
					},
				],

				// Apply any overrides
				...overrides,
			};

			// Add to documents array
			this.documents.push(duplicatedDoc);
			this.saveDocuments();

			// Update search index
			this.addToSearchIndex(duplicatedDoc);

			console.log("Document duplicated:", duplicatedDoc.title);
			return duplicatedDoc;
		} catch (error) {
			console.error("Error duplicating document:", error);
			throw error;
		}
	}

	/**
	 * Export document in various formats
	 * @param {string} documentId - Document ID
	 * @param {string} format - Export format (html, txt, md, pdf)
	 * @returns {string} - Exported content or download URL
	 */
	exportDocument(documentId, format = "html") {
		try {
			const document = this.documents.find((doc) => doc.id === documentId);
			if (!document) {
				throw new Error("Document not found");
			}

			const currentUser = this.authSystem.getCurrentUser();
			if (!this.canViewDocument(document, currentUser)) {
				throw new Error("Permission denied");
			}

			// Increment download count
			document.downloadCount = (document.downloadCount || 0) + 1;
			this.saveDocuments();

			switch (format.toLowerCase()) {
				case "html":
					return this.exportAsHTML(document);
				case "txt":
					return this.exportAsText(document);
				case "md":
					return this.exportAsMarkdown(document);
				case "json":
					return this.exportAsJSON(document);
				default:
					throw new Error("Unsupported export format");
			}
		} catch (error) {
			console.error("Error exporting document:", error);
			throw error;
		}
	}

	// ========================
	// FILE VALIDATION & UTILITIES
	// ========================

	validateFile(file) {
		const maxSize = 10 * 1024 * 1024; // 10MB
		const allowedTypes = [
			"text/plain",
			"text/html",
			"text/css",
			"text/javascript",
			"text/markdown",
			"text/csv",
			"application/json",
			"application/xml",
			"text/xml",
			"application/pdf",
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp",
			"image/svg+xml",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		];

		if (file.size > maxSize) {
			return {
				valid: false,
				error: "File size exceeds 10MB limit",
			};
		}

		if (!allowedTypes.includes(file.type)) {
			return {
				valid: false,
				error: `File type ${file.type} is not supported`,
			};
		}

		return { valid: true };
	}

	isTextFile(file) {
		const textTypes = [
			"text/plain",
			"text/html",
			"text/css",
			"text/javascript",
			"text/markdown",
			"text/csv",
			"application/json",
			"application/xml",
			"text/xml",
		];
		return textTypes.includes(file.type);
	}

	createDocumentFromFile(file, fileContent, metadata, currentUser) {
		const document = {
			id: this.generateDocumentId(),
			title: metadata.title || this.getFileNameWithoutExtension(file.name),
			content: this.isTextFile(file) ? fileContent : "", // Store text content directly
			type: this.getDocumentTypeFromFile(file),
			category: metadata.category || "imported",

			// File information
			fileName: file.name,
			fileSize: file.size,
			mimeType: file.type,
			isImported: true,
			isCustomCreated: false,
			originalFile: this.isTextFile(file) ? null : fileContent, // Store binary files as data URLs

			// Metadata
			author: currentUser.name,
			authorEmail: currentUser.email,
			createdAt: new Date().toISOString(),
			lastModified: file.lastModified
				? new Date(file.lastModified).toISOString()
				: new Date().toISOString(),
			version: 1,

			// Status and access
			status: metadata.status || "published",
			visibility: metadata.visibility || "internal",

			// Content metadata
			description: metadata.description || "",
			tags: metadata.tags || [],
			department: metadata.department || currentUser.department || "",

			// Statistics
			viewCount: 0,
			downloadCount: 0,
			averageRating: 0,
			ratingCount: 0,

			// Collaboration
			allowComments: metadata.allowComments !== false,
			requiresApproval: metadata.requiresApproval || false,
			approvedBy: null,
			approvedAt: null,

			// Revision tracking
			lastEditedBy: currentUser.email,
			editHistory: [
				{
					timestamp: new Date().toISOString(),
					user: currentUser.email,
					action: "imported",
					version: 1,
				},
			],
		};

		return document;
	}

	getDocumentTypeFromFile(file) {
		const extension = this.getFileExtension(file.name).toLowerCase();
		const typeMap = {
			txt: "document",
			html: "document",
			htm: "document",
			md: "document",
			css: "code",
			js: "code",
			json: "code",
			xml: "code",
			csv: "data",
			pdf: "document",
			jpg: "image",
			jpeg: "image",
			png: "image",
			gif: "image",
			webp: "image",
			svg: "image",
			doc: "document",
			docx: "document",
		};
		return typeMap[extension] || "document";
	}

	getFileExtension(fileName) {
		return fileName.split(".").pop() || "";
	}

	getFileNameWithoutExtension(fileName) {
		return fileName.replace(/\.[^/.]+$/, "");
	}

	generateDocumentId() {
		return "doc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
	}

	canEditDocument(document, user) {
		if (!user) return false;

		// Owner can always edit
		if (document.authorEmail === user.email) return true;

		// Admin can edit any document
		if (this.permissionsManager?.hasPermission("admin")) return true;

		// Department managers can edit documents in their department
		if (user.role === "manager" && document.department === user.department)
			return true;

		return false;
	}

	canViewDocument(document, user) {
		if (!user) return false;

		// Public documents can be viewed by anyone
		if (document.visibility === "public") return true;

		// Internal documents can be viewed by authenticated users
		if (document.visibility === "internal") return true;

		// Private documents can only be viewed by owner
		if (document.visibility === "private") {
			return document.authorEmail === user.email;
		}

		// Department restricted
		if (document.visibility === "department") {
			return document.department === user.department;
		}

		return false;
	}

	// Export format methods
	exportAsHTML(document) {
		const html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${document.title}</title>
	<style>
		body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
		.header { border-bottom: 1px solid #ccc; margin-bottom: 20px; padding-bottom: 10px; }
		.meta { color: #666; font-size: 0.9em; }
	</style>
</head>
<body>
	<div class="header">
		<h1>${document.title}</h1>
		<div class="meta">
			<p>Author: ${document.author}</p>
			<p>Created: ${new Date(document.createdAt).toLocaleDateString()}</p>
			<p>Last Modified: ${new Date(document.lastModified).toLocaleDateString()}</p>
		</div>
	</div>
	<div class="content">
		${document.content}
	</div>
</body>
</html>`;

		this.downloadFile(html, `${document.title}.html`, "text/html");
		return html;
	}

	exportAsText(document) {
		const text = `${document.title}\n${"=".repeat(
			document.title.length
		)}\n\nAuthor: ${document.author}\nCreated: ${new Date(
			document.createdAt
		).toLocaleDateString()}\nLast Modified: ${new Date(
			document.lastModified
		).toLocaleDateString()}\n\n${this.stripHTML(document.content)}`;

		this.downloadFile(text, `${document.title}.txt`, "text/plain");
		return text;
	}

	exportAsMarkdown(document) {
		const markdown = `# ${document.title}\n\n**Author:** ${
			document.author
		}  \n**Created:** ${new Date(
			document.createdAt
		).toLocaleDateString()}  \n**Last Modified:** ${new Date(
			document.lastModified
		).toLocaleDateString()}\n\n${this.htmlToMarkdown(document.content)}`;

		this.downloadFile(markdown, `${document.title}.md`, "text/markdown");
		return markdown;
	}

	exportAsJSON(document) {
		const json = JSON.stringify(document, null, 2);
		this.downloadFile(json, `${document.title}.json`, "application/json");
		return json;
	}

	downloadFile(content, fileName, mimeType) {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	stripHTML(html) {
		const div = document.createElement("div");
		div.innerHTML = html;
		return div.textContent || div.innerText || "";
	}

	htmlToMarkdown(html) {
		// Basic HTML to Markdown conversion
		return html
			.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n")
			.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n")
			.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n")
			.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
			.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
			.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
			.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
			.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
			.replace(/<br[^>]*>/gi, "\n")
			.replace(/<[^>]*>/g, ""); // Remove remaining HTML tags
	}
}
