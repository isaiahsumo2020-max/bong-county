(() => {
  const profileFields = [
    ['Capital', 'capital'],
    ['Region', 'region'],
    ['Established', 'established'],
    ['Population', 'population'],
    ['Area', 'area_km2'],
    ['Districts', 'districts_count']
  ];

  const resourceDefinitions = [
    {
      id: 'districts',
      title: 'Districts',
      table: 'districts',
      columns: 'id,name,description',
      order: 'display_order',
      render: row => [row.name, row.description]
    },
    {
      id: 'leaders',
      title: 'County leadership',
      table: 'leaders',
      columns: 'id,name,role,era,bio,photo_url',
      order: 'display_order',
      filter: query => query.eq('is_published', true),
      render: row => [row.name, [row.role, row.era].filter(Boolean).join(' · '), row.bio],
      image: 'photo_url'
    },
    {
      id: 'tourism',
      title: 'Tourism',
      table: 'tourism_sites',
      columns: 'id,name,description,location,category,cover_image_url',
      order: 'name',
      filter: query => query.eq('is_published', true),
      render: row => [row.name, [row.category, row.location].filter(Boolean).join(' · '), row.description],
      image: 'cover_image_url'
    },
    {
      id: 'content',
      title: 'Published stories and articles',
      table: 'content',
      columns: 'id,title,excerpt,type,published_at',
      order: 'published_at',
      descending: true,
      filter: query => query.eq('status', 'published'),
      render: row => [row.title, [row.type, formatDate(row.published_at)].filter(Boolean).join(' · '), row.excerpt]
    },
    {
      id: 'events',
      title: 'Upcoming events',
      table: 'events',
      columns: 'id,title,description,event_date,location',
      order: 'event_date',
      filter: query => query.eq('is_published', true).gte('event_date', new Date().toISOString()),
      render: row => [row.title, [formatDate(row.event_date), row.location].filter(Boolean).join(' · '), row.description]
    },
    {
      id: 'opportunities',
      title: 'Opportunities',
      table: 'opportunities',
      columns: 'id,title,description,deadline,status,type',
      order: 'created_at',
      descending: true,
      filter: query => query.eq('is_published', true).in('status', ['open', 'closing_soon']),
      render: row => [row.title, [row.type, row.status, formatDate(row.deadline)].filter(Boolean).join(' · '), row.description]
    }
  ];

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
  }

  function safeImageUrl(value) {
    if (!value) return null;
    try {
      const url = new URL(value, window.location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }

  function showError(message) {
    const error = document.getElementById('county-error');
    error.textContent = message;
    error.hidden = false;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    element.textContent = value || '';
    return element;
  }

  function renderCounty(county) {
    document.title = `${county.name} | Liberia CountySphere`;
    setText('county-name', county.name);
    setText('county-status', county.status === 'live' ? 'County profile' : 'County information');
    setText('county-tagline', county.tagline);
    setText('county-description', county.description);

    const hero = document.getElementById('county-hero');
    if (county.primary_color && CSS.supports('color', county.primary_color)) {
      hero.style.background = `linear-gradient(125deg, ${county.primary_color}, #173d2d)`;
    }
    hero.hidden = false;

    const facts = document.getElementById('county-facts');
    profileFields.forEach(([label, field]) => {
      if (county[field] === null || county[field] === undefined || county[field] === '') return;
      const item = document.createElement('li');
      item.textContent = `${label}: ${county[field]}`;
      facts.appendChild(item);
    });

    const imageUrl = safeImageUrl(county.cover_image_url);
    const cover = document.getElementById('county-cover');
    if (imageUrl) {
      cover.src = imageUrl;
      cover.alt = `${county.name} county`;
      cover.hidden = false;
    }
  }

  function renderSection(definition, rows, error) {
    const section = document.createElement('section');
    section.className = 'resource-section';
    section.setAttribute('aria-labelledby', `section-${definition.id}`);

    const heading = document.createElement('h2');
    heading.id = `section-${definition.id}`;
    heading.textContent = definition.title;
    section.appendChild(heading);

    if (error) {
      const message = document.createElement('p');
      message.className = 'notice notice-error';
      message.textContent = `Unable to load ${definition.title.toLowerCase()}. Please try again later.`;
      section.appendChild(message);
      console.error(`County page: failed loading ${definition.table}:`, error);
      return section;
    }

    if (!rows.length) {
      const empty = document.createElement('p');
      empty.className = 'notice';
      empty.textContent = `No ${definition.title.toLowerCase()} available yet.`;
      section.appendChild(empty);
      return section;
    }

    const list = document.createElement('div');
    list.className = 'resource-list';
    rows.forEach(row => {
      const card = document.createElement('article');
      card.className = 'resource-card';
      const imageUrl = definition.image && safeImageUrl(row[definition.image]);
      if (imageUrl) {
        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = row.name || row.title || definition.title;
        image.loading = 'lazy';
        image.addEventListener('error', () => image.remove(), { once: true });
        card.appendChild(image);
      }

      const [title, meta, description] = definition.render(row);
      const titleElement = document.createElement('h3');
      titleElement.textContent = title || 'Untitled';
      card.appendChild(titleElement);
      if (meta) {
        const metadata = document.createElement('p');
        metadata.textContent = meta;
        card.appendChild(metadata);
      }
      if (description) {
        const details = document.createElement('p');
        details.textContent = description;
        card.appendChild(details);
      }
      list.appendChild(card);
    });
    section.appendChild(list);
    return section;
  }

  async function loadSection(client, countyId, definition) {
    let query = client
      .from(definition.table)
      .select(definition.columns)
      .eq('county_id', countyId)
      .order(definition.order, { ascending: !definition.descending, nullsFirst: false })
      .limit(6);
    if (definition.filter) query = definition.filter(query);
    return query;
  }

  async function initialize() {
    const loading = document.getElementById('county-loading');
    const resources = document.getElementById('county-resources');
    const slug = new URLSearchParams(window.location.search).get('county')
      || document.body.dataset.countySlug;
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      loading.hidden = true;
      showError('A valid county was not specified.');
      return;
    }

    const client = window.supabaseClient;
    if (!client) {
      loading.hidden = true;
      showError('County information is temporarily unavailable.');
      console.error('County page: Supabase client is unavailable.');
      return;
    }

    try {
      const { data: county, error } = await client
        .from('counties')
        .select('id,name,slug,region,capital,status,tagline,description,population,area_km2,established,districts_count,primary_color,cover_image_url')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      if (!county) {
        loading.hidden = true;
        showError('This county could not be found.');
        return;
      }

      renderCounty(county);
      loading.hidden = true;
      const results = await Promise.all(resourceDefinitions.map(async definition => {
        try {
          const { data, error: queryError } = await loadSection(client, county.id, definition);
          return { definition, rows: data || [], error: queryError };
        } catch (error) {
          return { definition, rows: [], error };
        }
      }));
      results.forEach(({ definition, rows, error }) => {
        resources.appendChild(renderSection(definition, rows, error));
      });
    } catch (error) {
      loading.hidden = true;
      showError('County information could not be loaded. Please try again later.');
      console.error('County page: failed loading county record:', error);
      const retry = document.createElement('button');
      retry.className = 'retry-button';
      retry.type = 'button';
      retry.textContent = 'Retry';
      retry.addEventListener('click', () => {
        document.getElementById('county-error').hidden = true;
        loading.hidden = false;
        initialize();
      }, { once: true });
      document.getElementById('county-error').appendChild(retry);
    }
  }

  document.addEventListener('DOMContentLoaded', initialize, { once: true });
})();
