/*
	Fills the section panels in index.html with the text and images from content.json.
	Text values in content.json are inserted as HTML, so they can contain links, <i>, and <b>.
*/

(function() {

	var columns = 3;

	function attr(value) {
		return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
	}

	function fill(id, html) {

		var target = document.getElementById(id);

		if (target)
			target.innerHTML = html;

	}

	function renderAboutMe(aboutme) {

		return aboutme.paragraphs.map(function(text) {
			return '<p>' + text + '<br><br></p>';
		}).join('');

	}

	function renderSpecs(build) {

		if (!build.board)
			return '';

		return '<div class="table-wrapper"><table class="alt1">'
			+ '<thead><tr><th style="width:25%"><b>Board</b></th><th>' + build.board + '</th></tr></thead>'
			+ '<tbody>'
			+ '<tr><td><b>Switches</b></td><td>' + (build.switches || '') + '</td></tr>'
			+ '<tr><td><b>Keycaps</b></td><td>' + (build.keycaps || '') + '</td></tr>'
			+ '</tbody></table></div>';

	}

	function renderBuild(build) {

		var caption = '<b>' + build.title + '</b>',
			description = build.description || '';

		if (build.note)
			caption = '<i>' + build.note + '</i><br>' + caption;

		if (build.showcase)
			description += '<br>Showcase link <a href="' + attr(build.showcase) + '" target="_blank">here</a>';

		return '<img src="' + attr(build.image) + '" alt="' + attr(build.title) + '">'
			+ '<p>' + caption + '</p>'
			+ renderSpecs(build)
			+ '<p>' + description + '<br><br></p>';

	}

	function renderGallery(builds) {

		var count = Math.min(columns, builds.length),
			perColumn = Math.floor(builds.length / count),
			extra = builds.length % count,
			start = 0,
			html = '';

		if (builds.length == 0)
			return '<p>No builds match these filters.</p>';

		for (var i = 0; i < count; i++) {

			var size = perColumn + (i < extra ? 1 : 0);

			html += '<div class="column">'
				+ builds.slice(start, start + size).map(renderBuild).join('')
				+ '</div>';

			start += size;

		}

		return html;

	}

	// Gallery filters.
	// Options come from the "showcase", "form_factor" and "keywords" fields in content.json,
	// so adding a new form factor or keyword to a build adds a matching filter button.

		function countBy(builds, valuesOf) {

			var counts = {};

			builds.forEach(function(build) {
				valuesOf(build).forEach(function(value) {
					counts[value] = (counts[value] || 0) + 1;
				});
			});

			return counts;

		}

		function sortOptions(counts) {

			return Object.keys(counts).sort(function(a, b) {

				var na = parseFloat(a),
					nb = parseFloat(b);

				if (!isNaN(na) && !isNaN(nb))
					return na - nb;

				if (!isNaN(na))
					return -1;

				if (!isNaN(nb))
					return 1;

				return a.localeCompare(b);

			});

		}

		function filterButton(filter, value, label, active) {

			return '<button type="button" class="button small' + (active ? ' primary' : '') + '"'
				+ ' data-filter="' + filter + '" data-value="' + attr(value) + '"'
				+ ' aria-pressed="' + (active ? 'true' : 'false') + '">'
				+ label
				+ '</button>';

		}

		function filterGroup(label, buttons) {

			return '<div class="gallery-filter-group">'
				+ '<span class="gallery-filter-label">' + label + '</span>'
				+ buttons.join('')
				+ '</div>';

		}

		function formFactorsOf(build) {
			return build.form_factor ? [build.form_factor] : [];
		}

		function keywordsOf(build) {
			return build.keywords || [];
		}

		function setupGallery(builds) {

			var state = { showcase: false, formFactor: null, keywords: [] },
				showcaseCount = builds.filter(function(build) { return build.showcase; }).length,
				formFactorCounts = countBy(builds, formFactorsOf),
				keywordCounts = countBy(builds, keywordsOf),
				formFactors = sortOptions(formFactorCounts),
				keywords = sortOptions(keywordCounts),
				filters = document.getElementById('gallery-filters');

			function matches(build) {

				if (state.showcase && !build.showcase)
					return false;

				if (state.formFactor !== null && build.form_factor !== state.formFactor)
					return false;

				return state.keywords.every(function(keyword) {
					return keywordsOf(build).indexOf(keyword) != -1;
				});

			}

			function render() {

				var shown = builds.filter(matches),
					groups = [];

				if (showcaseCount > 0)
					groups.push(filterGroup('Showcase', [
						filterButton('showcase', 'yes', 'Has showcase link (' + showcaseCount + ')', state.showcase)
					]));

				if (formFactors.length > 0)
					groups.push(filterGroup('Form factor', [
						filterButton('form_factor', '', 'All', state.formFactor === null)
					].concat(formFactors.map(function(value) {
						return filterButton('form_factor', value, value + ' (' + formFactorCounts[value] + ')', state.formFactor === value);
					}))));

				if (keywords.length > 0)
					groups.push(filterGroup('Keywords', keywords.map(function(value) {
						return filterButton('keyword', value, value + ' (' + keywordCounts[value] + ')', state.keywords.indexOf(value) != -1);
					})));

				if (filters)
					filters.innerHTML = groups.join('')
						+ '<p class="gallery-filter-count">Showing ' + shown.length + ' of ' + builds.length + ' builds'
						+ (shown.length < builds.length ? ' <a href="#" data-filter="reset">Clear filters</a>' : '')
						+ '</p>';

				fill('gallery-content', renderGallery(shown));

			}

			if (filters)
				filters.addEventListener('click', function(event) {

					var control = event.target.closest('[data-filter]'),
						value,
						index;

					if (!control)
						return;

					event.preventDefault();
					value = control.getAttribute('data-value');

					switch (control.getAttribute('data-filter')) {

						case 'showcase':
							state.showcase = !state.showcase;
							break;

						case 'form_factor':
							state.formFactor = value === '' || value === state.formFactor ? null : value;
							break;

						case 'keyword':
							index = state.keywords.indexOf(value);

							if (index == -1)
								state.keywords.push(value);
							else
								state.keywords.splice(index, 1);

							break;

						case 'reset':
							state = { showcase: false, formFactor: null, keywords: [] };
							break;

					}

					render();

				});

			render();

		}

	function renderRequest(request) {

		return '<p>' + request.intro + '</p>'
			+ '<iframe src="' + attr(request.formUrl) + '" width="100%" height="' + attr(request.formHeight) + '" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>';

	}

	function renderContact(contact) {

		var links = contact.links.map(function(link) {

			var target = /^https?:/.test(link.url) ? ' target="_blank"' : '';

			return '<li><a href="' + attr(link.url) + '"' + target + ' class="icon ' + attr(link.icon) + '">'
				+ '<span class="label">' + link.label + '</span></a></li>';

		}).join('');

		return '<p>' + contact.intro.join('<br><br>') + '<br></p>'
			+ '<ul class="icons">' + links + '</ul>';

	}

	fetch('content.json')
		.then(function(response) {

			if (!response.ok)
				throw new Error('HTTP ' + response.status);

			return response.json();

		})
		.then(function(content) {

			fill('aboutme-content', renderAboutMe(content.aboutme));
			setupGallery(content.gallery);
			fill('request-content', renderRequest(content.request));
			fill('contact-content', renderContact(content.contact));

		})
		.catch(function(error) {

			console.error('Could not load content.json', error);

			['aboutme-content', 'gallery-content', 'request-content', 'contact-content'].forEach(function(id) {
				fill(id, '<p>This section could not be loaded.</p>');
			});

		});

})();
