// DocumentUIManager - Enhanced UI for document management
// Handles advanced search, filtering, document viewer, and collaboration features

export class DocumentUIManager {
	constructor(documentManager, app) {
		this.documentManager = documentManager;
		this.app = app;
		this.authSystem = app.authSystem;
		this.permissionsManager = app.permissionsManager;

		// UI state
		this.currentView = "grid"; // grid or list
		this.selectedDocuments = new Set();
		this.isAdvancedSearchOpen = false;
		this.currentDocument = null;

		// Search and filter state
		this.searchQuery = "";
		this.activeFilters = {
			category: "all",
			author: "all",
			status: "all",
			dateRange: "all",
			tags: [],
		};

		// Initialize UI
		this.init();
	}

	init() {
		this.bindEvents();
		this.setupAdvancedSearch();
	}

	bindEvents() {
		// Enhanced search
		const searchInput = document.getElementById("documentSearch");
		if (searchInput) {
			let searchTimeout;
			searchInput.addEventListener("input", (e) => {
				clearTimeout(searchTimeout);
				searchTimeout = setTimeout(() => {
					this.handleSearch(e.target.value);
				}, 300);
			});
		}

		// Filter controls
		document.addEventListener("change", (e) => {
			if (e.target.matches(".doc-filter-select")) {
				this.handleFilterChange(e.target);
			}
		});

		// View toggle
		document.addEventListener("click", (e) => {
			if (e.target.matches(".view-toggle-btn")) {
				this.handleViewToggle(e.target.dataset.view);
			}
		});

		// Document actions
		document.addEventListener("click", (e) => {
			if (e.target.matches(".doc-action-btn")) {
				this.handleDocumentAction(e);
			}
		});

		// Bulk selection
		document.addEventListener("change", (e) => {
			if (e.target.matches(".doc-select-checkbox")) {
				this.handleDocumentSelection(e.target);
			}
		});

		// Advanced search toggle
		const advancedSearchBtn = document.getElementById("advancedSearchBtn");
		if (advancedSearchBtn) {
			advancedSearchBtn.addEventListener("click", () => {
				this.toggleAdvancedSearch();
			});
		}

		// Sort controls
		document.addEventListener("change", (e) => {
			if (e.target.matches(".sort-select")) {
				this.handleSortChange(e.target);
			}
		});
	}

	enhanceDocumentsView() {
		const docsView = document.getElementById("docs-view");
		if (!docsView) return;

		// Update the documents view with enhanced UI
		const enhanced = `
			<div class="view-header">
				<h3>📚 Knowledge Base</h3>
				<div class="document-view-controls">
					<div class="search-section">
						<div class="search-bar">
							<input type="search" id="documentSearch" placeholder="Search documents, content, tags..." class="search-input">
							<button class="btn btn-secondary" id="advancedSearchBtn">🔍 Advanced</button>
						</div>
						<div class="quick-filters">
							<select class="filter-select doc-filter-select" data-filter="category">
								<option value="all">All Categories</option>
								<option value="hr">HR & Policies</option>
								<option value="operations">Operations</option>
								<option value="training">Training</option>
								<option value="templates">Templates</option>
								<option value="general">General</option>
							</select>
							<select class="filter-select doc-filter-select" data-filter="status">
								<option value="all">All Status</option>
								<option value="published">Published</option>
								<option value="draft">Draft</option>
								<option value="pending_approval">Pending Approval</option>
								<option value="archived">Archived</option>
							</select>
							<select class="filter-select sort-select" data-sort="field">
								<option value="lastModified">Last Modified</option>
								<option value="title">Title</option>
								<option value="author">Author</option>
								<option value="viewCount">Most Viewed</option>
								<option value="rating">Rating</option>
								<option value="dateCreated">Date Created</option>
							</select>
							<select class="filter-select sort-select" data-sort="order">
								<option value="desc">Newest First</option>
								<option value="asc">Oldest First</option>
							</select>
						</div>
					</div>
					<div class="view-actions">
						<div class="view-toggles">
							<button class="btn btn-icon view-toggle-btn active" data-view="grid" title="Grid View">⊞</button>
							<button class="btn btn-icon view-toggle-btn" data-view="list" title="List View">☰</button>
						</div>
						<button class="btn btn-secondary" id="bulkDocActionsBtn" style="display: none;">
							Bulk Actions (<span id="selectedDocCount">0</span>)
						</button>
						<div class="dropdown">
							<button class="btn btn-primary dropdown-toggle" id="createDocBtn">
								+ Create Document
							</button>
							<div class="dropdown-menu">
								<a href="#" onclick="documentUIManager.showCreateDocumentModal()">📄 Blank Document</a>
								<a href="#" onclick="documentUIManager.showTemplateSelectionModal()">📋 From Template</a>
								<a href="#" onclick="documentUIManager.showImportModal()">📁 Import Document</a>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="advanced-search-panel" id="advancedSearchPanel" style="display: none;">
				<div class="advanced-search-content">
					<div class="search-filters-grid">
						<div class="filter-group">
							<label>Date Range</label>
							<select class="filter-select doc-filter-select" data-filter="dateRange">
								<option value="all">All Time</option>
								<option value="today">Today</option>
								<option value="week">This Week</option>
								<option value="month">This Month</option>
								<option value="quarter">This Quarter</option>
							</select>
						</div>
						<div class="filter-group">
							<label>Author</label>
							<select class="filter-select doc-filter-select" data-filter="author">
								<option value="all">All Authors</option>
								${this.getAuthorOptions()}
							</select>
						</div>
						<div class="filter-group">
							<label>Content Type</label>
							<select class="filter-select doc-filter-select" data-filter="type">
								<option value="all">All Types</option>
								<option value="policy">Policy</option>
								<option value="procedure">Procedure</option>
								<option value="guideline">Guideline</option>
								<option value="handbook">Handbook</option>
								<option value="template">Template</option>
							</select>
						</div>
						<div class="filter-group">
							<label>Tags</label>
							<div class="tags-filter">
								${this.getTagsFilter()}
							</div>
						</div>
					</div>
					<div class="search-actions">
						<button class="btn btn-secondary" onclick="documentUIManager.clearAllFilters()">Clear All</button>
						<button class="btn btn-primary" onclick="documentUIManager.applyAdvancedSearch()">Apply Filters</button>
					</div>
				</div>
			</div>

			<div class="documents-stats-bar">
				<div class="stats-info">
					<span id="documentResultsCount">Loading documents...</span>
				</div>
				<div class="stats-actions">
					<button class="btn btn-icon" onclick="documentUIManager.exportDocumentsList()" title="Export List">📊</button>
					<button class="btn btn-icon" onclick="documentUIManager.refreshDocuments()" title="Refresh">🔄</button>
				</div>
			</div>

			<div class="documents-container">
				<div id="documentsGridView" class="documents-grid">
					<!-- Documents will be populated here -->
				</div>
				<div id="documentsListView" class="documents-list" style="display: none;">
					<!-- Alternative list view -->
				</div>
			</div>
		`;

		// Find and replace the existing content
		const existingContent = docsView.querySelector(".view-content") || docsView;
		existingContent.innerHTML = enhanced;

		// Render initial documents
		this.renderDocuments();
		this.bindEvents();
	}

	getAuthorOptions() {
		const authors = this.documentManager.getAllAuthors();
		return authors
			.map((authorId) => {
				const user = this.app.userManager.getUserById(authorId);
				const name = user ? user.name : authorId;
				return `<option value="${authorId}">${name}</option>`;
			})
			.join("");
	}

	getTagsFilter() {
		const allTags = this.documentManager.getAllTags();
		return allTags
			.map(
				(tag) => `
			<label class="tag-filter-item">
				<input type="checkbox" value="${tag}" class="tag-filter-checkbox">
				<span class="tag-label">${tag}</span>
			</label>
		`
			)
			.join("");
	}

	setupAdvancedSearch() {
		// Bind tag filter checkboxes
		document.addEventListener("change", (e) => {
			if (e.target.matches(".tag-filter-checkbox")) {
				this.handleTagFilterChange();
			}
		});
	}

	handleSearch(query) {
		this.searchQuery = query;
		this.renderDocuments();
	}

	handleFilterChange(filterElement) {
		const filterType = filterElement.dataset.filter;
		const value = filterElement.value;

		this.activeFilters[filterType] = value;
		this.renderDocuments();
	}

	handleSortChange(sortElement) {
		const sortType = sortElement.dataset.sort;
		const value = sortElement.value;

		if (sortType === "field") {
			this.documentManager.sortBy = value;
		} else if (sortType === "order") {
			this.documentManager.sortOrder = value;
		}

		this.renderDocuments();
	}

	handleTagFilterChange() {
		const selectedTags = Array.from(
			document.querySelectorAll(".tag-filter-checkbox:checked")
		).map((cb) => cb.value);
		this.activeFilters.tags = selectedTags;
		this.renderDocuments();
	}

	handleViewToggle(view) {
		this.currentView = view;

		// Update button states
		document.querySelectorAll(".view-toggle-btn").forEach((btn) => {
			btn.classList.toggle("active", btn.dataset.view === view);
		});

		// Toggle view containers
		const gridView = document.getElementById("documentsGridView");
		const listView = document.getElementById("documentsListView");

		if (view === "grid") {
			gridView.style.display = "grid";
			listView.style.display = "none";
		} else {
			gridView.style.display = "none";
			listView.style.display = "block";
		}

		this.renderDocuments();
	}

	handleDocumentSelection(checkbox) {
		const docId = parseInt(checkbox.value);

		if (checkbox.checked) {
			this.selectedDocuments.add(docId);
		} else {
			this.selectedDocuments.delete(docId);
		}

		this.updateBulkActionsVisibility();
	}

	updateBulkActionsVisibility() {
		const bulkBtn = document.getElementById("bulkDocActionsBtn");
		const countSpan = document.getElementById("selectedDocCount");

		if (bulkBtn && countSpan) {
			if (this.selectedDocuments.size > 0) {
				bulkBtn.style.display = "block";
				countSpan.textContent = this.selectedDocuments.size;
			} else {
				bulkBtn.style.display = "none";
			}
		}
	}

	toggleAdvancedSearch() {
		this.isAdvancedSearchOpen = !this.isAdvancedSearchOpen;
		const panel = document.getElementById("advancedSearchPanel");
		const btn = document.getElementById("advancedSearchBtn");

		if (panel) {
			panel.style.display = this.isAdvancedSearchOpen ? "block" : "none";
		}

		if (btn) {
			btn.textContent = this.isAdvancedSearchOpen
				? "🔍 Hide Advanced"
				: "🔍 Advanced";
		}
	}

	clearAllFilters() {
		// Reset filters
		this.activeFilters = {
			category: "all",
			author: "all",
			status: "all",
			dateRange: "all",
			tags: [],
		};

		// Reset UI
		document.querySelectorAll(".doc-filter-select").forEach((select) => {
			select.value = "all";
		});

		document.querySelectorAll(".tag-filter-checkbox").forEach((checkbox) => {
			checkbox.checked = false;
		});

		// Clear search
		const searchInput = document.getElementById("documentSearch");
		if (searchInput) {
			searchInput.value = "";
			this.searchQuery = "";
		}

		this.renderDocuments();
	}

	applyAdvancedSearch() {
		this.toggleAdvancedSearch();
		this.renderDocuments();
	}

	renderDocuments() {
		// Get filtered documents
		const documents = this.documentManager.getDocuments(
			this.searchQuery,
			this.activeFilters
		);

		// Update stats
		this.updateDocumentStats(documents);

		// Render based on current view
		if (this.currentView === "grid") {
			this.renderDocumentsGrid(documents);
		} else {
			this.renderDocumentsList(documents);
		}
	}

	updateDocumentStats(documents) {
		const statsElement = document.getElementById("documentResultsCount");
		if (statsElement) {
			const totalDocs = this.documentManager.documents.length;
			const filteredCount = documents.length;

			if (filteredCount === totalDocs) {
				statsElement.textContent = `${totalDocs} documents`;
			} else {
				statsElement.textContent = `${filteredCount} of ${totalDocs} documents`;
			}
		}
	}

	renderDocumentsGrid(documents) {
		const container = document.getElementById("documentsGridView");
		if (!container) return;

		if (documents.length === 0) {
			container.innerHTML = `
				<div class="empty-state">
					<div class="empty-icon">📄</div>
					<h3>No documents found</h3>
					<p>Try adjusting your search or filters, or create a new document.</p>
					<button class="btn btn-primary" onclick="documentUIManager.showCreateDocumentModal()">
						Create Document
					</button>
				</div>
			`;
			return;
		}

		container.innerHTML = documents
			.map((doc) => this.renderDocumentCard(doc))
			.join("");
	}

	renderDocumentsList(documents) {
		const container = document.getElementById("documentsListView");
		if (!container) return;

		if (documents.length === 0) {
			container.innerHTML = `
				<div class="empty-state">
					<div class="empty-icon">📄</div>
					<h3>No documents found</h3>
					<p>Try adjusting your search or filters, or create a new document.</p>
					<button class="btn btn-primary" onclick="documentUIManager.showCreateDocumentModal()">
						Create Document
					</button>
				</div>
			`;
			return;
		}

		const tableHTML = `
			<table class="documents-table">
				<thead>
					<tr>
						<th width="40">
							<input type="checkbox" id="selectAllDocs" onchange="documentUIManager.handleSelectAll(this)">
						</th>
						<th>Document</th>
						<th>Author</th>
						<th>Category</th>
						<th>Status</th>
						<th>Modified</th>
						<th>Views</th>
						<th>Rating</th>
						<th width="120">Actions</th>
					</tr>
				</thead>
				<tbody>
					${documents.map((doc) => this.renderDocumentRow(doc)).join("")}
				</tbody>
			</table>
		`;

		container.innerHTML = tableHTML;
	}

	renderDocumentCard(doc) {
		const isSelected = this.selectedDocuments.has(doc.id);
		const canEdit = this.documentManager.canEditDocument(
			doc,
			this.authSystem.getCurrentUser()
		);
		const canDelete = this.documentManager.canDeleteDocument(
			doc,
			this.authSystem.getCurrentUser()
		);

		return `
			<div class="document-card ${isSelected ? "selected" : ""}" data-doc-id="${
			doc.id
		}">
				<div class="document-card-header">
					<input type="checkbox" class="doc-select-checkbox" value="${doc.id}" ${
			isSelected ? "checked" : ""
		}>
					<div class="document-icon">${doc.icon}</div>
					<div class="document-status-badge ${doc.status}">${doc.status}</div>
				</div>
				
				<div class="document-card-content" onclick="documentUIManager.openDocument(${
					doc.id
				})">
					<h4 class="document-title">${doc.title}</h4>
					<p class="document-description">${doc.description}</p>
					<div class="document-tags">
						${doc.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
					</div>
				</div>

				<div class="document-card-meta">
					<div class="document-author">
						<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(
							doc.author
						)}&size=24" alt="${doc.author}">
						<span>${doc.author}</span>
					</div>
					<div class="document-stats">
						<span title="Views">👁️ ${doc.viewCount || 0}</span>
						<span title="Rating">⭐ ${
							doc.averageRating ? doc.averageRating.toFixed(1) : "N/A"
						}</span>
					</div>
				</div>

				<div class="document-card-footer">
					<div class="document-date">
						<small>Modified ${this.formatDate(doc.lastModified)}</small>
					</div>
					<div class="document-actions">
						<button class="btn btn-icon" onclick="documentUIManager.openDocument(${
							doc.id
						})" title="View">👁️</button>
						${
							canEdit
								? `<button class="btn btn-icon" onclick="documentUIManager.editDocument(${doc.id})" title="Edit">✏️</button>`
								: ""
						}
						<button class="btn btn-icon" onclick="documentUIManager.shareDocument(${
							doc.id
						})" title="Share">🔗</button>
						<button class="btn btn-icon" onclick="documentUIManager.downloadDocument(${
							doc.id
						})" title="Download">⬇️</button>
						${
							canDelete
								? `<button class="btn btn-icon danger" onclick="documentUIManager.deleteDocument(${doc.id})" title="Delete">🗑️</button>`
								: ""
						}
					</div>
				</div>
			</div>
		`;
	}

	renderDocumentRow(doc) {
		const isSelected = this.selectedDocuments.has(doc.id);
		const canEdit = this.documentManager.canEditDocument(
			doc,
			this.authSystem.getCurrentUser()
		);
		const canDelete = this.documentManager.canDeleteDocument(
			doc,
			this.authSystem.getCurrentUser()
		);

		return `
			<tr class="document-row ${isSelected ? "selected" : ""}" data-doc-id="${
			doc.id
		}">
				<td>
					<input type="checkbox" class="doc-select-checkbox" value="${doc.id}" ${
			isSelected ? "checked" : ""
		}>
				</td>
				<td class="document-info-cell">
					<div class="document-info">
						<div class="document-icon-title">
							<span class="document-icon">${doc.icon}</span>
							<span class="document-title">${doc.title}</span>
						</div>
						<div class="document-description">${doc.description}</div>
						<div class="document-tags">
							${doc.tags
								.slice(0, 3)
								.map((tag) => `<span class="tag">${tag}</span>`)
								.join("")}
							${
								doc.tags.length > 3
									? `<span class="tag-more">+${doc.tags.length - 3}</span>`
									: ""
							}
						</div>
					</div>
				</td>
				<td>
					<div class="author-info">
						<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(
							doc.author
						)}&size=24" alt="${doc.author}">
						<span>${doc.author}</span>
					</div>
				</td>
				<td>
					<span class="category-badge ${doc.category}">${this.getCategoryName(
			doc.category
		)}</span>
				</td>
				<td>
					<span class="status-badge ${doc.status}">${doc.status}</span>
				</td>
				<td>
					<div class="date-info">
						<div>${this.formatDate(doc.lastModified)}</div>
						<small>v${doc.version}</small>
					</div>
				</td>
				<td>
					<span class="view-count">${doc.viewCount || 0}</span>
				</td>
				<td>
					<div class="rating-display">
						${doc.averageRating ? `⭐ ${doc.averageRating.toFixed(1)}` : "N/A"}
					</div>
				</td>
				<td>
					<div class="row-actions">
						<button class="btn btn-icon" onclick="documentUIManager.openDocument(${
							doc.id
						})" title="View">👁️</button>
						${
							canEdit
								? `<button class="btn btn-icon" onclick="documentUIManager.editDocument(${doc.id})" title="Edit">✏️</button>`
								: ""
						}
						<button class="btn btn-icon" onclick="documentUIManager.shareDocument(${
							doc.id
						})" title="Share">🔗</button>
						${
							canDelete
								? `<button class="btn btn-icon danger" onclick="documentUIManager.deleteDocument(${doc.id})" title="Delete">🗑️</button>`
								: ""
						}
					</div>
				</td>
			</tr>
		`;
	}

	// Document actions
	openDocument(id) {
		const document = this.documentManager.getDocumentById(id);
		if (!document) {
			this.app.showNotification("Document not found", "error");
			return;
		}

		// Record view
		this.documentManager.recordDocumentView(id);

		// Open document viewer modal
		this.showDocumentViewer(document);
	}

	showDocumentViewer(document) {
		const canEdit = this.documentManager.canEditDocument(
			document,
			this.authSystem.getCurrentUser()
		);
		const feedback = this.documentManager.getDocumentFeedback(document.id);
		const versions = this.documentManager.getDocumentVersions(document.id);

		const viewer = `
			<div class="document-viewer">
				<div class="document-viewer-header">
					<div class="document-info">
						<h2>${document.icon} ${document.title}</h2>
						<div class="document-meta">
							<span>By ${document.author}</span>
							<span>•</span>
							<span>v${document.version}</span>
							<span>•</span>
							<span>Modified ${this.formatDate(document.lastModified)}</span>
							<span>•</span>
							<span>${document.viewCount || 0} views</span>
						</div>
						<div class="document-tags">
							${document.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
						</div>
					</div>
					<div class="document-actions">
						${
							canEdit
								? `<button class="btn btn-secondary" onclick="documentUIManager.editDocument(${document.id})">✏️ Edit</button>`
								: ""
						}
						<button class="btn btn-secondary" onclick="documentUIManager.downloadDocument(${
							document.id
						})">⬇️ Download</button>
						<button class="btn btn-secondary" onclick="documentUIManager.shareDocument(${
							document.id
						})">🔗 Share</button>
						<div class="dropdown">
							<button class="btn btn-secondary dropdown-toggle">⋯ More</button>
							<div class="dropdown-menu">
								<a href="#" onclick="documentUIManager.showDocumentVersions(${
									document.id
								})">📜 Version History</a>
								<a href="#" onclick="documentUIManager.showDocumentFeedback(${
									document.id
								})">💬 Feedback</a>
								<a href="#" onclick="documentUIManager.printDocument(${
									document.id
								})">🖨️ Print</a>
							</div>
						</div>
					</div>
				</div>

				<div class="document-viewer-content">
					<div class="document-content">
						${this.renderDocumentContent(document.content)}
					</div>
				</div>

				<div class="document-viewer-sidebar">
					<div class="sidebar-section">
						<h4>📊 Statistics</h4>
						<div class="document-stats">
							<div class="stat-item">
								<span class="stat-label">Views</span>
								<span class="stat-value">${document.viewCount || 0}</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">Downloads</span>
								<span class="stat-value">${document.downloadCount || 0}</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">Rating</span>
								<span class="stat-value">${
									document.averageRating
										? `⭐ ${document.averageRating.toFixed(1)}`
										: "N/A"
								}</span>
							</div>
						</div>
					</div>

					<div class="sidebar-section">
						<h4>💬 Quick Feedback</h4>
						<div class="quick-feedback">
							<div class="rating-input">
								<label>Rate this document:</label>
								<div class="star-rating">
									${[1, 2, 3, 4, 5]
										.map(
											(star) => `
										<button class="star-btn" data-rating="${star}" onclick="documentUIManager.rateDocument(${document.id}, ${star})">⭐</button>
									`
										)
										.join("")}
								</div>
							</div>
							<textarea placeholder="Leave feedback..." id="quickFeedbackText" rows="3"></textarea>
							<button class="btn btn-primary btn-sm" onclick="documentUIManager.submitQuickFeedback(${
								document.id
							})">
								Submit Feedback
							</button>
						</div>
					</div>

					${
						feedback.length > 0
							? `
					<div class="sidebar-section">
						<h4>Recent Feedback</h4>
						<div class="recent-feedback">
							${feedback
								.slice(-3)
								.map(
									(f) => `
								<div class="feedback-item">
									<div class="feedback-header">
										<strong>${f.userName}</strong>
										${f.rating ? `<span class="rating">⭐ ${f.rating}</span>` : ""}
									</div>
									<div class="feedback-comment">${f.comment}</div>
									<div class="feedback-date">${this.formatDate(f.dateCreated)}</div>
								</div>
							`
								)
								.join("")}
						</div>
					</div>
					`
							: ""
					}
				</div>
			</div>
		`;

		this.app.showCustomModal(
			`Document: ${document.title}`,
			viewer,
			"document-viewer-modal"
		);
	}

	renderDocumentContent(content) {
		// Simple markdown-like rendering
		return content
			.replace(/\n/g, "<br>")
			.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
			.replace(/\*(.*?)\*/g, "<em>$1</em>")
			.replace(/`(.*?)`/g, "<code>$1</code>");
	}

	// Utility methods
	formatDate(dateString) {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now - date;
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return "Today";
		if (diffDays === 1) return "Yesterday";
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

		return date.toLocaleDateString();
	}

	getCategoryName(category) {
		const categoryNames = {
			hr: "HR & Policies",
			operations: "Operations",
			training: "Training",
			templates: "Templates",
			general: "General",
		};
		return categoryNames[category] || category;
	}

	// Modal methods
	showCreateDocumentModal() {
		// TODO: Implement document creation modal
		this.app.showNotification("Document creation modal coming soon!", "info");
	}

	showTemplateSelectionModal() {
		// TODO: Implement template selection
		this.app.showNotification("Template selection coming soon!", "info");
	}

	editDocument(id) {
		// TODO: Implement document editing
		this.app.showNotification("Document editing coming soon!", "info");
	}

	shareDocument(id) {
		// TODO: Implement document sharing
		this.app.showNotification("Document sharing coming soon!", "info");
	}

	downloadDocument(id) {
		const document = this.documentManager.getDocumentById(id);
		if (document) {
			this.documentManager.recordDocumentDownload(id);
			// Create downloadable content
			const content = `${document.title}\n\n${document.content}`;
			const blob = new Blob([content], { type: "text/plain" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${document.title
				.replace(/[^a-z0-9]/gi, "_")
				.toLowerCase()}.txt`;
			a.click();
			URL.revokeObjectURL(url);
		}
	}

	deleteDocument(id) {
		if (confirm("Are you sure you want to delete this document?")) {
			try {
				this.documentManager.deleteDocument(id);
				this.renderDocuments();
				this.app.showNotification("Document deleted successfully", "success");
			} catch (error) {
				this.app.showNotification(error.message, "error");
			}
		}
	}

	// Feedback methods
	rateDocument(documentId, rating) {
		try {
			this.documentManager.addDocumentFeedback(documentId, { rating });
			this.app.showNotification("Rating submitted", "success");

			// Update star display
			document.querySelectorAll(".star-btn").forEach((btn, index) => {
				btn.style.color = index < rating ? "#ffc107" : "#ddd";
			});
		} catch (error) {
			this.app.showNotification(error.message, "error");
		}
	}

	submitQuickFeedback(documentId) {
		const comment = document.getElementById("quickFeedbackText")?.value;
		if (!comment) return;

		try {
			this.documentManager.addDocumentFeedback(documentId, { comment });
			document.getElementById("quickFeedbackText").value = "";
			this.app.showNotification("Feedback submitted", "success");
		} catch (error) {
			this.app.showNotification(error.message, "error");
		}
	}

	// Bulk actions
	handleSelectAll(checkbox) {
		const isChecked = checkbox.checked;
		document.querySelectorAll(".doc-select-checkbox").forEach((cb) => {
			cb.checked = isChecked;
			const docId = parseInt(cb.value);
			if (isChecked) {
				this.selectedDocuments.add(docId);
			} else {
				this.selectedDocuments.delete(docId);
			}
		});
		this.updateBulkActionsVisibility();
	}

	// Export functionality
	exportDocumentsList() {
		const documents = this.documentManager.getDocuments(
			this.searchQuery,
			this.activeFilters
		);
		const csvContent = this.convertDocumentsToCSV(documents);
		this.downloadCSV(csvContent, "documents-list.csv");
	}

	convertDocumentsToCSV(documents) {
		const headers = [
			"Title",
			"Author",
			"Category",
			"Status",
			"Version",
			"Views",
			"Rating",
			"Created",
			"Modified",
		];
		const rows = documents.map((doc) => [
			doc.title,
			doc.author,
			doc.category,
			doc.status,
			doc.version,
			doc.viewCount || 0,
			doc.averageRating || 0,
			new Date(doc.dateCreated).toLocaleDateString(),
			new Date(doc.lastModified).toLocaleDateString(),
		]);

		return [headers, ...rows]
			.map((row) => row.map((field) => `"${field}"`).join(","))
			.join("\n");
	}

	downloadCSV(content, filename) {
		const blob = new Blob([content], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		window.URL.revokeObjectURL(url);
	}

	// ========================
	// FILE IMPORT & DOCUMENT CREATION
	// ========================

	/**
	 * Show file import modal
	 */
	showImportModal() {
		try {
			console.log("DocumentUIManager.showImportModal called");
			if (!this.app || typeof this.app.createModal !== "function") {
				console.error("App or createModal method not available");
				this.app.showNotification &&
					this.app.showNotification("Modal system not available", "error");
				return;
			}

			const modal = this.app.createModal(
				"Import Document",
				this.getImportModalContent()
			);
			this.bindImportModalEvents(modal);
		} catch (error) {
			console.error("Error in showImportModal:", error);
			this.app &&
				this.app.showNotification &&
				this.app.showNotification("Failed to open import modal", "error");
		}
	}

	/**
	 * Show create document modal
	 */
	showCreateDocumentModal() {
		try {
			console.log("DocumentUIManager.showCreateDocumentModal called");
			if (!this.app || typeof this.app.createModal !== "function") {
				console.error("App or createModal method not available");
				this.app.showNotification &&
					this.app.showNotification("Modal system not available", "error");
				return;
			}

			const modal = this.app.createModal(
				"Create New Document",
				this.getCreateDocumentModalContent()
			);
			this.bindCreateDocumentModalEvents(modal);

			// Add emergency close button for testing
			const emergencyCloseBtn = document.createElement("button");
			emergencyCloseBtn.textContent = "FORCE CLOSE";
			emergencyCloseBtn.style.cssText =
				"position: absolute; top: 10px; right: 50px; z-index: 10001; background: red; color: white; border: none; padding: 5px 10px; cursor: pointer;";
			emergencyCloseBtn.onclick = () => {
				console.log("Emergency close clicked");
				// Direct DOM removal
				const allModals = document.querySelectorAll(
					".modal-overlay, #customModalOverlay"
				);
				allModals.forEach((m) => m.remove());
				if (this.app) this.app.currentModal = null;
			};
			modal.appendChild(emergencyCloseBtn);
		} catch (error) {
			console.error("Error in showCreateDocumentModal:", error);
			this.app &&
				this.app.showNotification &&
				this.app.showNotification(
					"Failed to open create document modal",
					"error"
				);
		}
	}

	/**
	 * Show template selection modal
	 */
	showTemplateSelectionModal() {
		try {
			console.log("DocumentUIManager.showTemplateSelectionModal called");
			if (!this.app || typeof this.app.createModal !== "function") {
				console.error("App or createModal method not available");
				this.app.showNotification &&
					this.app.showNotification("Modal system not available", "error");
				return;
			}

			const modal = this.app.createModal(
				"Create From Template",
				this.getTemplateSelectionModalContent()
			);
			this.bindTemplateSelectionModalEvents(modal);
		} catch (error) {
			console.error("Error in showTemplateSelectionModal:", error);
			this.app &&
				this.app.showNotification &&
				this.app.showNotification(
					"Failed to open template selection modal",
					"error"
				);
		}
	}

	/**
	 * Get import modal content
	 */
	getImportModalContent() {
		return `
			<div class="import-document-form">
				<div class="upload-section">
					<div class="drag-drop-zone" id="dragDropZone">
						<div class="upload-content">
							<div class="upload-icon">📁</div>
							<h4>Drag & Drop Files Here</h4>
							<p>or <button type="button" class="btn-link" id="browseFilesBtn">browse your computer</button></p>
							<input type="file" id="fileInput" multiple accept=".txt,.html,.htm,.md,.css,.js,.json,.xml,.csv,.pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.doc,.docx" style="display: none;">
						</div>
						<div class="upload-progress" id="uploadProgress" style="display: none;">
							<div class="progress-bar">
								<div class="progress-fill" id="progressFill"></div>
							</div>
							<div class="progress-text" id="progressText">Uploading...</div>
						</div>
					</div>
					
					<div class="file-list" id="selectedFilesList" style="display: none;">
						<h5>Selected Files:</h5>
						<div class="files-preview" id="filesPreview"></div>
					</div>
				</div>

				<div class="import-options">
					<h5>Import Options</h5>
					<div class="form-grid">
						<div class="form-group">
							<label for="importCategory">Category</label>
							<select id="importCategory" class="form-control">
								<option value="imported">Imported Documents</option>
								<option value="hr">HR & Policies</option>
								<option value="operations">Operations</option>
								<option value="training">Training</option>
								<option value="templates">Templates</option>
								<option value="general">General</option>
							</select>
						</div>
						<div class="form-group">
							<label for="importVisibility">Visibility</label>
							<select id="importVisibility" class="form-control">
								<option value="internal">Internal (All employees)</option>
								<option value="department">Department only</option>
								<option value="private">Private (Only me)</option>
								<option value="public">Public</option>
							</select>
						</div>
						<div class="form-group">
							<label for="importStatus">Status</label>
							<select id="importStatus" class="form-control">
								<option value="published">Published</option>
								<option value="draft">Draft</option>
								<option value="pending_approval">Pending Approval</option>
							</select>
						</div>
						<div class="form-group">
							<label for="importTags">Tags (comma-separated)</label>
							<input type="text" id="importTags" class="form-control" placeholder="hr, policy, training...">
						</div>
					</div>
					<div class="form-group">
						<label for="importDescription">Description</label>
						<textarea id="importDescription" class="form-control" rows="3" placeholder="Brief description of the imported documents..."></textarea>
					</div>
					<div class="form-group">
						<label class="checkbox-label">
							<input type="checkbox" id="allowComments" checked>
							Allow comments on imported documents
						</label>
					</div>
					<div class="form-group">
						<label class="checkbox-label">
							<input type="checkbox" id="requireApproval">
							Require approval before publishing
						</label>
					</div>
				</div>

				<div class="modal-actions">
					<button type="button" class="btn btn-secondary" onclick="window.studyHallApp.closeModal()">Cancel</button>
					<button type="button" class="btn btn-primary" id="importDocumentsBtn" disabled>Import Documents</button>
				</div>
			</div>
		`;
	}

	/**
	 * Get create document modal content
	 */
	getCreateDocumentModalContent() {
		return `
			<div class="create-document-form">
				<div class="form-section">
					<div class="form-group">
						<label for="docTitle">Document Title *</label>
						<input type="text" id="docTitle" class="form-control" placeholder="Enter document title..." required>
					</div>
					
					<div class="form-grid">
						<div class="form-group">
							<label for="docCategory">Category</label>
							<select id="docCategory" class="form-control">
								<option value="general">General</option>
								<option value="hr">HR & Policies</option>
								<option value="operations">Operations</option>
								<option value="training">Training</option>
								<option value="templates">Templates</option>
								<option value="procedures">Procedures</option>
							</select>
						</div>
						<div class="form-group">
							<label for="docType">Document Type</label>
							<select id="docType" class="form-control">
								<option value="document">Document</option>
								<option value="policy">Policy</option>
								<option value="procedure">Procedure</option>
								<option value="guideline">Guideline</option>
								<option value="handbook">Handbook</option>
								<option value="template">Template</option>
							</select>
						</div>
					</div>

					<div class="form-grid">
						<div class="form-group">
							<label for="docVisibility">Visibility</label>
							<select id="docVisibility" class="form-control">
								<option value="internal">Internal (All employees)</option>
								<option value="department">Department only</option>
								<option value="private">Private (Only me)</option>
								<option value="public">Public</option>
							</select>
						</div>
						<div class="form-group">
							<label for="docStatus">Status</label>
							<select id="docStatus" class="form-control">
								<option value="draft">Draft</option>
								<option value="published">Published</option>
								<option value="pending_approval">Pending Approval</option>
							</select>
						</div>
					</div>

					<div class="form-group">
						<label for="docDescription">Description</label>
						<textarea id="docDescription" class="form-control" rows="2" placeholder="Brief description of the document..."></textarea>
					</div>

					<div class="form-group">
						<label for="docTags">Tags (comma-separated)</label>
						<input type="text" id="docTags" class="form-control" placeholder="policy, hr, training...">
					</div>
				</div>

				<div class="form-section">
					<label for="docContent">Content</label>
					<div class="editor-toolbar">
						<button type="button" class="btn-icon" onclick="documentUIManager.formatText('bold')" title="Bold">
							<strong>B</strong>
						</button>
						<button type="button" class="btn-icon" onclick="documentUIManager.formatText('italic')" title="Italic">
							<em>I</em>
						</button>
						<button type="button" class="btn-icon" onclick="documentUIManager.formatText('underline')" title="Underline">
							<u>U</u>
						</button>
						<span class="separator">|</span>
						<button type="button" class="btn-icon" onclick="documentUIManager.formatText('insertOrderedList')" title="Numbered List">
							1.
						</button>
						<button type="button" class="btn-icon" onclick="documentUIManager.formatText('insertUnorderedList')" title="Bullet List">
							•
						</button>
						<span class="separator">|</span>
						<button type="button" class="btn-icon" onclick="documentUIManager.insertHeading(1)" title="Heading 1">
							H1
						</button>
						<button type="button" class="btn-icon" onclick="documentUIManager.insertHeading(2)" title="Heading 2">
							H2
						</button>
						<button type="button" class="btn-icon" onclick="documentUIManager.insertHeading(3)" title="Heading 3">
							H3
						</button>
						<span class="separator">|</span>
						<button type="button" class="btn-icon" onclick="documentUIManager.insertLink()" title="Insert Link">
							🔗
						</button>
						<button type="button" class="btn-icon" onclick="documentUIManager.insertTable()" title="Insert Table">
							⊞
						</button>
					</div>
					<div id="docContent" class="rich-text-editor" contenteditable="true" placeholder="Start writing your document content..."></div>
				</div>

				<div class="form-section">
					<div class="form-options">
						<label class="checkbox-label">
							<input type="checkbox" id="allowComments" checked>
							Allow comments on this document
						</label>
						<label class="checkbox-label">
							<input type="checkbox" id="requireApproval">
							Require approval before publishing
						</label>
					</div>
				</div>

				<div class="modal-actions">
					<button type="button" class="btn btn-secondary" onclick="window.studyHallApp.closeModal()">Cancel</button>
					<button type="button" class="btn btn-outline" id="saveAsDraftBtn">Save as Draft</button>
					<button type="button" class="btn btn-primary" id="createDocumentBtn">Create Document</button>
				</div>
			</div>
		`;
	}

	/**
	 * Get template selection modal content
	 */
	getTemplateSelectionModalContent() {
		const templates = this.getDocumentTemplates();

		return `
			<div class="template-selection">
				<div class="templates-grid">
					${templates
						.map(
							(template) => `
						<div class="template-card" data-template-id="${template.id}">
							<div class="template-icon">${template.icon}</div>
							<h4>${template.name}</h4>
							<p>${template.description}</p>
							<div class="template-tags">
								${template.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
							</div>
							<button class="btn btn-primary template-select-btn" onclick="documentUIManager.createFromTemplate('${
								template.id
							}')">
								Use Template
							</button>
						</div>
					`
						)
						.join("")}
				</div>
			</div>
		`;
	}

	/**
	 * Bind import modal events
	 */
	bindImportModalEvents(modal) {
		const dragDropZone = modal.querySelector("#dragDropZone");
		const fileInput = modal.querySelector("#fileInput");
		const browseBtn = modal.querySelector("#browseFilesBtn");
		const importBtn = modal.querySelector("#importDocumentsBtn");

		// File browse button
		browseBtn.addEventListener("click", () => {
			fileInput.click();
		});

		// File input change
		fileInput.addEventListener("change", (e) => {
			this.handleFileSelection(e.target.files, modal);
		});

		// Drag and drop events
		dragDropZone.addEventListener("dragover", (e) => {
			e.preventDefault();
			dragDropZone.classList.add("drag-over");
		});

		dragDropZone.addEventListener("dragleave", (e) => {
			e.preventDefault();
			dragDropZone.classList.remove("drag-over");
		});

		dragDropZone.addEventListener("drop", (e) => {
			e.preventDefault();
			dragDropZone.classList.remove("drag-over");
			this.handleFileSelection(e.dataTransfer.files, modal);
		});

		// Import button
		importBtn.addEventListener("click", () => {
			this.handleDocumentImport(modal);
		});
	}

	/**
	 * Bind create document modal events
	 */
	bindCreateDocumentModalEvents(modal) {
		const createBtn = modal.querySelector("#createDocumentBtn");
		const draftBtn = modal.querySelector("#saveAsDraftBtn");
		const titleInput = modal.querySelector("#docTitle");
		const contentEditor = modal.querySelector("#docContent");

		// Enable/disable create button based on title
		titleInput.addEventListener("input", () => {
			const hasTitle = titleInput.value.trim().length > 0;
			createBtn.disabled = !hasTitle;
			draftBtn.disabled = !hasTitle;
		});

		// Create document button
		createBtn.addEventListener("click", () => {
			this.handleDocumentCreation(modal, "published");
		});

		// Save as draft button
		draftBtn.addEventListener("click", () => {
			this.handleDocumentCreation(modal, "draft");
		});

		// Rich text editor setup
		this.setupRichTextEditor(contentEditor);
	}

	/**
	 * Bind template selection modal events
	 */
	bindTemplateSelectionModalEvents(modal) {
		// Events are bound inline in the template HTML
	}

	/**
	 * Handle file selection for import
	 */
	handleFileSelection(files, modal) {
		const filesArray = Array.from(files);
		const validFiles = [];
		const invalidFiles = [];

		filesArray.forEach((file) => {
			const validation = this.documentManager.validateFile(file);
			if (validation.valid) {
				validFiles.push(file);
			} else {
				invalidFiles.push({ file, error: validation.error });
			}
		});

		if (invalidFiles.length > 0) {
			const errorMsg = invalidFiles
				.map((item) => `${item.file.name}: ${item.error}`)
				.join("\n");
			this.app.showNotification(
				`Some files were rejected:\n${errorMsg}`,
				"error"
			);
		}

		if (validFiles.length > 0) {
			this.displaySelectedFiles(validFiles, modal);
			modal.querySelector("#importDocumentsBtn").disabled = false;
		}
	}

	/**
	 * Display selected files in the modal
	 */
	displaySelectedFiles(files, modal) {
		const filesList = modal.querySelector("#selectedFilesList");
		const filesPreview = modal.querySelector("#filesPreview");

		filesPreview.innerHTML = files
			.map(
				(file) => `
			<div class="file-preview-item" data-file-name="${file.name}">
				<div class="file-icon">${this.getFileIcon(file)}</div>
				<div class="file-info">
					<div class="file-name">${file.name}</div>
					<div class="file-size">${this.formatFileSize(file.size)}</div>
				</div>
				<button class="btn-icon remove-file-btn" onclick="documentUIManager.removeSelectedFile('${
					file.name
				}', this)">
					×
				</button>
			</div>
		`
			)
			.join("");

		filesList.style.display = "block";
		this.selectedFiles = files;
	}

	/**
	 * Handle document import
	 */
	async handleDocumentImport(modal) {
		if (!this.selectedFiles || this.selectedFiles.length === 0) {
			this.app.showNotification("Please select files to import", "error");
			return;
		}

		const metadata = this.getImportMetadata(modal);
		const progressEl = modal.querySelector("#uploadProgress");
		const progressFill = modal.querySelector("#progressFill");
		const progressText = modal.querySelector("#progressText");

		progressEl.style.display = "block";

		try {
			const importedDocs = [];
			const totalFiles = this.selectedFiles.length;

			for (let i = 0; i < totalFiles; i++) {
				const file = this.selectedFiles[i];
				const progress = ((i + 1) / totalFiles) * 100;

				progressFill.style.width = `${progress}%`;
				progressText.textContent = `Importing ${file.name}... (${
					i + 1
				}/${totalFiles})`;

				const document = await this.documentManager.importFile(file, metadata);
				importedDocs.push(document);
			}

			this.app.closeModal();
			this.refreshDocuments();
			this.app.showNotification(
				`Successfully imported ${importedDocs.length} document(s)`,
				"success"
			);
		} catch (error) {
			console.error("Import error:", error);
			this.app.showNotification(`Import failed: ${error.message}`, "error");
		} finally {
			progressEl.style.display = "none";
		}
	}

	/**
	 * Handle document creation
	 */
	handleDocumentCreation(modal, status = "published") {
		try {
			console.log("handleDocumentCreation called with status:", status);
			console.log("App reference:", this.app);
			console.log("App closeModal method:", typeof this.app?.closeModal);

			const documentData = this.getDocumentFormData(modal);
			documentData.status = status;

			const document = this.documentManager.createNewDocument(documentData);

			console.log("About to call this.app.closeModal()");
			if (this.app && typeof this.app.closeModal === "function") {
				this.app.closeModal();
				console.log("closeModal called successfully");
			} else {
				console.error("App or closeModal method not available:", {
					app: this.app,
					closeModal: this.app?.closeModal,
				});
				// Fallback: try to close modal manually
				console.log("Attempting fallback modal close");
				const modals = document.querySelectorAll(
					".modal-overlay, #customModalOverlay"
				);
				modals.forEach((modal) => {
					console.log("Removing modal via fallback:", modal);
					modal.remove();
				});
			}

			this.refreshDocuments();
			this.app.showNotification(
				`Document "${document.title}" ${
					status === "draft" ? "saved as draft" : "created"
				} successfully`,
				"success"
			);

			// If published, optionally open the document for editing
			if (status === "published") {
				setTimeout(() => {
					this.openDocument(document.id);
				}, 500);
			}
		} catch (error) {
			console.error("Creation error:", error);
			this.app.showNotification(
				`Failed to create document: ${error.message}`,
				"error"
			);
		}
	}

	/**
	 * Create document from template
	 */
	createFromTemplate(templateId) {
		const templates = this.getDocumentTemplates();
		const template = templates.find((t) => t.id === templateId);

		if (!template) {
			this.app.showNotification("Template not found", "error");
			return;
		}

		try {
			const documentData = {
				title: `New ${template.name}`,
				content: template.content,
				type: template.type,
				category: template.category,
				tags: [...template.tags],
				description: `Created from ${template.name} template`,
			};

			const document = this.documentManager.createNewDocument(documentData);

			this.app.closeModal();
			this.refreshDocuments();
			this.app.showNotification(
				`Document created from template "${template.name}"`,
				"success"
			);

			// Open for editing
			setTimeout(() => {
				this.editDocument(document.id);
			}, 500);
		} catch (error) {
			console.error("Template creation error:", error);
			this.app.showNotification(
				`Failed to create from template: ${error.message}`,
				"error"
			);
		}
	}

	/**
	 * Get import metadata from modal form
	 */
	getImportMetadata(modal) {
		const category = modal.querySelector("#importCategory").value;
		const visibility = modal.querySelector("#importVisibility").value;
		const status = modal.querySelector("#importStatus").value;
		const tags = modal
			.querySelector("#importTags")
			.value.split(",")
			.map((tag) => tag.trim())
			.filter((tag) => tag);
		const description = modal.querySelector("#importDescription").value;
		const allowComments = modal.querySelector("#allowComments").checked;
		const requireApproval = modal.querySelector("#requireApproval").checked;

		return {
			category,
			visibility,
			status,
			tags,
			description,
			allowComments,
			requiresApproval: requireApproval,
		};
	}

	/**
	 * Get document form data from modal
	 */
	getDocumentFormData(modal) {
		const title = modal.querySelector("#docTitle").value.trim();
		const category = modal.querySelector("#docCategory").value;
		const type = modal.querySelector("#docType").value;
		const visibility = modal.querySelector("#docVisibility").value;
		const status = modal.querySelector("#docStatus").value;
		const description = modal.querySelector("#docDescription").value;
		const tags = modal
			.querySelector("#docTags")
			.value.split(",")
			.map((tag) => tag.trim())
			.filter((tag) => tag);
		const content = modal.querySelector("#docContent").innerHTML;
		const allowComments = modal.querySelector("#allowComments").checked;
		const requireApproval = modal.querySelector("#requireApproval").checked;

		return {
			title,
			category,
			type,
			visibility,
			status,
			description,
			tags,
			content,
			allowComments,
			requiresApproval: requireApproval,
		};
	}

	/**
	 * Setup rich text editor
	 */
	setupRichTextEditor(editor) {
		// Basic rich text functionality
		editor.addEventListener("paste", (e) => {
			e.preventDefault();
			const text = e.clipboardData.getData("text/plain");
			document.execCommand("insertText", false, text);
		});

		// Placeholder behavior
		editor.addEventListener("focus", () => {
			if (editor.innerHTML === "" || editor.innerHTML === "<br>") {
				editor.innerHTML = "";
			}
		});

		editor.addEventListener("blur", () => {
			if (editor.innerHTML.trim() === "") {
				editor.innerHTML = "";
			}
		});
	}

	/**
	 * Rich text formatting functions
	 */
	formatText(command, value = null) {
		document.execCommand(command, false, value);
	}

	insertHeading(level) {
		const selection = window.getSelection();
		if (selection.rangeCount > 0) {
			document.execCommand("formatBlock", false, `h${level}`);
		}
	}

	insertLink() {
		const url = prompt("Enter URL:");
		if (url) {
			document.execCommand("createLink", false, url);
		}
	}

	insertTable() {
		const rows = prompt("Number of rows:", "3");
		const cols = prompt("Number of columns:", "3");

		if (rows && cols) {
			let tableHTML =
				'<table border="1" style="border-collapse: collapse; width: 100%;">';
			for (let i = 0; i < parseInt(rows); i++) {
				tableHTML += "<tr>";
				for (let j = 0; j < parseInt(cols); j++) {
					tableHTML +=
						'<td style="padding: 8px; border: 1px solid #ddd;">&nbsp;</td>';
				}
				tableHTML += "</tr>";
			}
			tableHTML += "</table>";

			document.execCommand("insertHTML", false, tableHTML);
		}
	}

	/**
	 * Get file icon based on file type
	 */
	getFileIcon(file) {
		const extension = file.name.split(".").pop().toLowerCase();
		const iconMap = {
			txt: "📄",
			html: "🌐",
			md: "📝",
			pdf: "📕",
			doc: "📘",
			docx: "📘",
			jpg: "🖼️",
			jpeg: "🖼️",
			png: "🖼️",
			gif: "🖼️",
			csv: "📊",
			json: "📋",
			xml: "📋",
		};
		return iconMap[extension] || "📄";
	}

	/**
	 * Format file size for display
	 */
	formatFileSize(bytes) {
		const sizes = ["Bytes", "KB", "MB", "GB"];
		if (bytes === 0) return "0 Bytes";
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
	}

	/**
	 * Remove selected file from import list
	 */
	removeSelectedFile(fileName, buttonElement) {
		this.selectedFiles = this.selectedFiles.filter(
			(file) => file.name !== fileName
		);
		buttonElement.closest(".file-preview-item").remove();

		if (this.selectedFiles.length === 0) {
			const modal = buttonElement.closest(".modal");
			modal.querySelector("#selectedFilesList").style.display = "none";
			modal.querySelector("#importDocumentsBtn").disabled = true;
		}
	}

	/**
	 * Get available document templates
	 */
	getDocumentTemplates() {
		return [
			{
				id: "policy_template",
				name: "HR Policy",
				description: "Standard template for company policies",
				icon: "📋",
				type: "policy",
				category: "hr",
				tags: ["policy", "hr", "template"],
				content: `
					<h1>[Policy Title]</h1>
					<h2>Purpose</h2>
					<p>This policy outlines...</p>
					<h2>Scope</h2>
					<p>This policy applies to...</p>
					<h2>Policy Statement</h2>
					<p>It is the policy of [Company] to...</p>
					<h2>Procedures</h2>
					<ol>
						<li>Step one...</li>
						<li>Step two...</li>
					</ol>
					<h2>Responsibilities</h2>
					<ul>
						<li><strong>Employees:</strong> ...</li>
						<li><strong>Managers:</strong> ...</li>
						<li><strong>HR Department:</strong> ...</li>
					</ul>
					<h2>Compliance</h2>
					<p>Failure to comply with this policy may result in...</p>
				`,
			},
			{
				id: "procedure_template",
				name: "Standard Operating Procedure",
				description: "Template for detailed process documentation",
				icon: "⚙️",
				type: "procedure",
				category: "operations",
				tags: ["procedure", "process", "template"],
				content: `
					<h1>[Procedure Title]</h1>
					<h2>Overview</h2>
					<p>This procedure describes how to...</p>
					<h2>Prerequisites</h2>
					<ul>
						<li>Requirement 1</li>
						<li>Requirement 2</li>
					</ul>
					<h2>Step-by-Step Instructions</h2>
					<ol>
						<li><strong>Step 1:</strong> Description...</li>
						<li><strong>Step 2:</strong> Description...</li>
						<li><strong>Step 3:</strong> Description...</li>
					</ol>
					<h2>Expected Results</h2>
					<p>After completing this procedure...</p>
					<h2>Troubleshooting</h2>
					<p>If issues occur...</p>
				`,
			},
			{
				id: "meeting_template",
				name: "Meeting Minutes",
				description: "Template for recording meeting notes",
				icon: "📝",
				type: "document",
				category: "general",
				tags: ["meeting", "minutes", "template"],
				content: `
					<h1>Meeting Minutes</h1>
					<h2>Meeting Details</h2>
					<ul>
						<li><strong>Date:</strong> [Date]</li>
						<li><strong>Time:</strong> [Time]</li>
						<li><strong>Location:</strong> [Location/Platform]</li>
						<li><strong>Meeting Type:</strong> [Regular/Special/Emergency]</li>
					</ul>
					<h2>Attendees</h2>
					<ul>
						<li>[Name] - [Role]</li>
						<li>[Name] - [Role]</li>
					</ul>
					<h2>Agenda Items</h2>
					<ol>
						<li><strong>[Topic]</strong> - Discussion and outcomes</li>
						<li><strong>[Topic]</strong> - Discussion and outcomes</li>
					</ol>
					<h2>Action Items</h2>
					<table border="1" style="border-collapse: collapse; width: 100%;">
						<tr>
							<th style="padding: 8px;">Action</th>
							<th style="padding: 8px;">Assigned To</th>
							<th style="padding: 8px;">Due Date</th>
							<th style="padding: 8px;">Status</th>
						</tr>
						<tr>
							<td style="padding: 8px;">[Action item]</td>
							<td style="padding: 8px;">[Name]</td>
							<td style="padding: 8px;">[Date]</td>
							<td style="padding: 8px;">Pending</td>
						</tr>
					</table>
					<h2>Next Meeting</h2>
					<p><strong>Date:</strong> [Date]<br>
					<strong>Time:</strong> [Time]<br>
					<strong>Location:</strong> [Location]</p>
				`,
			},
			{
				id: "training_template",
				name: "Training Material",
				description: "Template for creating training documentation",
				icon: "🎓",
				type: "document",
				category: "training",
				tags: ["training", "education", "template"],
				content: `
					<h1>[Training Title]</h1>
					<h2>Learning Objectives</h2>
					<p>By the end of this training, participants will be able to:</p>
					<ul>
						<li>Objective 1</li>
						<li>Objective 2</li>
						<li>Objective 3</li>
					</ul>
					<h2>Prerequisites</h2>
					<p>Before starting this training...</p>
					<h2>Training Content</h2>
					<h3>Module 1: [Topic]</h3>
					<p>Content for module 1...</p>
					<h3>Module 2: [Topic]</h3>
					<p>Content for module 2...</p>
					<h2>Practical Exercises</h2>
					<ol>
						<li><strong>Exercise 1:</strong> Description...</li>
						<li><strong>Exercise 2:</strong> Description...</li>
					</ol>
					<h2>Assessment</h2>
					<p>Knowledge check questions or practical assessment...</p>
					<h2>Additional Resources</h2>
					<ul>
						<li><a href="#">Resource 1</a></li>
						<li><a href="#">Resource 2</a></li>
					</ul>
				`,
			},
			{
				id: "handbook_template",
				name: "Employee Handbook Section",
				description: "Template for employee handbook sections",
				icon: "📖",
				type: "handbook",
				category: "hr",
				tags: ["handbook", "employee", "template"],
				content: `
					<h1>[Handbook Section Title]</h1>
					<h2>Introduction</h2>
					<p>This section covers...</p>
					<h2>Company Expectations</h2>
					<p>We expect all employees to...</p>
					<h2>Employee Rights</h2>
					<ul>
						<li>Right 1: Description...</li>
						<li>Right 2: Description...</li>
					</ul>
					<h2>Employee Responsibilities</h2>
					<ul>
						<li>Responsibility 1: Description...</li>
						<li>Responsibility 2: Description...</li>
					</ul>
					<h2>Procedures</h2>
					<p>To [accomplish task], follow these steps:</p>
					<ol>
						<li>Step 1</li>
						<li>Step 2</li>
					</ol>
					<h2>Contact Information</h2>
					<p>For questions about this topic, contact:</p>
					<ul>
						<li><strong>Department:</strong> [Contact info]</li>
						<li><strong>Email:</strong> [Email address]</li>
					</ul>
				`,
			},
		];
	}

	refreshDocuments() {
		this.renderDocuments();
		this.app.showNotification("Documents refreshed", "success");
	}
}
