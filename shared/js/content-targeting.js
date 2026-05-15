/**
 * CONTENT TARGETING SYSTEM
 * Smart content classification and audience matching
 * 
 * Features:
 * - Tag-based targeting
 * - Opportunity type classification
 * - Target audience selection
 * - Visibility level management
 * - Interest-based matching
 */

export class ContentTargeting {
  
  // Available tags organized by category
  static TAGS = {
    industry: [
      'agriculture', 'tourism', 'healthcare', 'education', 'technology',
      'finance', 'energy', 'transportation', 'manufacturing', 'retail'
    ],
    skill: [
      'leadership', 'communication', 'technical', 'management', 'sales',
      'marketing', 'research', 'writing', 'design', 'analysis'
    ],
    topic: [
      'sustainable', 'climate', 'youth', 'women', 'entrepreneurship',
      'innovation', 'community', 'development', 'governance', 'culture'
    ],
    region: [
      'bong', 'grand_cape_mount', 'grand_bassa', 'lofa', 'montserrado',
      'nimba', 'rivercess', 'rivercess', 'southeast_region'
    ]
  };

  // Opportunity types
  static OPPORTUNITY_TYPES = [
    { type: 'job', label: 'Job Opportunity', icon: '💼', color: 'blue' },
    { type: 'grant', label: 'Grant/Funding', icon: '💰', color: 'green' },
    { type: 'scholarship', label: 'Scholarship', icon: '🎓', color: 'purple' },
    { type: 'partnership', label: 'Partnership', icon: '🤝', color: 'orange' },
    { type: 'event', label: 'Event', icon: '📅', color: 'red' },
    { type: 'none', label: 'No Opportunity', icon: '📢', color: 'gray' }
  ];

  // Target audiences with descriptions
  static TARGET_AUDIENCES = [
    { name: 'students', icon: '🎓', description: 'University & school students' },
    { name: 'journalists', icon: '📰', description: 'Media & content professionals' },
    { name: 'organizations', icon: '🏢', description: 'Businesses & formal organizations' },
    { name: 'universities', icon: '🎓', description: 'Academic institutions' },
    { name: 'healthcare workers', icon: '⚕️', description: 'Medical & health professionals' },
    { name: 'youth advocates', icon: '👥', description: 'Youth leaders & advocates' },
    { name: 'ngos', icon: '🤝', description: 'Non-governmental organizations' },
    { name: 'developers', icon: '💻', description: 'Tech professionals & developers' }
  ];

  /**
   * Get all available tags
   */
  static getAllTags(category = null) {
    if (category) {
      return this.TAGS[category] || [];
    }
    
    const allTags = [];
    for (const tags of Object.values(this.TAGS)) {
      allTags.push(...tags);
    }
    return allTags;
  }

  /**
   * Get tags by category
   */
  static getTagsByCategory(category) {
    return this.TAGS[category] || [];
  }

  /**
   * Get all opportunity types
   */
  static getOpportunityTypes() {
    return this.OPPORTUNITY_TYPES;
  }

  /**
   * Get specific opportunity type
   */
  static getOpportunityType(type) {
    return this.OPPORTUNITY_TYPES.find(t => t.type === type) || null;
  }

  /**
   * Get all target audiences
   */
  static getTargetAudiences() {
    return this.TARGET_AUDIENCES;
  }

  /**
   * Get specific target audience
   */
  static getTargetAudience(name) {
    return this.TARGET_AUDIENCES.find(a => a.name === name) || null;
  }

  /**
   * Check if content matches user's interests
   */
  static matchesUserInterests(content, userSubscription) {
    if (!content || !userSubscription) return false;

    // Check if any target audience matches
    const audienceMatch = content.target_audiences?.some(aud =>
      userSubscription.interested_audiences?.includes(aud)
    );

    // Check if any tag matches
    const tagMatch = content.tags?.some(tag =>
      userSubscription.interested_tags?.includes(tag)
    );

    // Check county match (if specified)
    const countyMatch = !userSubscription.interested_counties?.length ||
      userSubscription.interested_counties.includes(content.county);

    // Return true if ANY criteria matched
    return audienceMatch || tagMatch || countyMatch;
  }

  /**
   * Calculate match score (0-100)
   */
  static calculateMatchScore(content, userSubscription) {
    if (!content || !userSubscription) return 0;

    let score = 0;
    let factors = 0;

    // Audience matching (weight: 40%)
    if (userSubscription.interested_audiences?.length > 0) {
      const audienceMatch = content.target_audiences?.some(aud =>
        userSubscription.interested_audiences.includes(aud)
      ) ? 40 : 0;
      score += audienceMatch;
      factors += 40;
    }

    // Tag matching (weight: 40%)
    if (userSubscription.interested_tags?.length > 0) {
      const tagMatches = content.tags?.filter(tag =>
        userSubscription.interested_tags.includes(tag)
      ).length || 0;
      const tagScore = Math.min((tagMatches / userSubscription.interested_tags.length) * 40, 40);
      score += tagScore;
      factors += 40;
    }

    // County matching (weight: 20%)
    if (userSubscription.interested_counties?.length > 0) {
      const countyMatch = userSubscription.interested_counties.includes(content.county) ? 20 : 0;
      score += countyMatch;
      factors += 20;
    }

    // Normalize to 0-100 scale
    return factors > 0 ? Math.round((score / factors) * 100) : 0;
  }

  /**
   * Filter content array by interests
   */
  static filterByInterests(contentArray, userSubscription) {
    return contentArray
      .filter(content => this.matchesUserInterests(content, userSubscription))
      .sort((a, b) => {
        const scoreA = this.calculateMatchScore(a, userSubscription);
        const scoreB = this.calculateMatchScore(b, userSubscription);
        return scoreB - scoreA; // Sort descending
      });
  }

  /**
   * Build targeting filter query
   */
  static buildTargetingQuery(filters) {
    const clauses = [];

    if (filters.tags && filters.tags.length > 0) {
      clauses.push(`tags && '{${filters.tags.join(',')}}'`);
    }

    if (filters.audiences && filters.audiences.length > 0) {
      clauses.push(`target_audiences && '{${filters.audiences.join(',')}}'`);
    }

    if (filters.opportunityType && filters.opportunityType !== 'none') {
      clauses.push(`opportunity_type = '${filters.opportunityType}'`);
    }

    if (filters.county) {
      clauses.push(`county = '${filters.county}'`);
    }

    if (filters.visibility) {
      clauses.push(`visibility = '${filters.visibility}'`);
    }

    return clauses.length > 0 ? clauses.join(' AND ') : null;
  }

  /**
   * Suggest audiences based on content type
   */
  static suggestAudiences(opportunityType) {
    const suggestions = {
      'job': ['students', 'youth advocates', 'developers', 'journalists'],
      'grant': ['organizations', 'ngos', 'universities'],
      'scholarship': ['students', 'youth advocates'],
      'partnership': ['organizations', 'ngos', 'universities', 'developers'],
      'event': ['students', 'journalists', 'youth advocates', 'organizations'],
      'none': ['journalists', 'students', 'organizations']
    };

    return suggestions[opportunityType] || [];
  }

  /**
   * Suggest tags based on content
   */
  static suggestTags(content) {
    const suggestions = [];
    
    // Analyze content body for keywords
    const body = (content.title + ' ' + content.description).toLowerCase();
    
    for (const [category, tags] of Object.entries(this.TAGS)) {
      for (const tag of tags) {
        if (body.includes(tag)) {
          suggestions.push(tag);
        }
      }
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  /**
   * Validate content targeting
   */
  static validateTargeting(content) {
    const errors = [];

    if (!content.tags || content.tags.length === 0) {
      errors.push('At least one tag is required');
    }

    if (!content.target_audiences || content.target_audiences.length === 0) {
      errors.push('At least one target audience is required');
    }

    if (!content.visibility) {
      errors.push('Visibility level is required');
    }

    // Validate tags are valid
    if (content.tags) {
      const allTags = this.getAllTags();
      const invalidTags = content.tags.filter(tag => !allTags.includes(tag));
      if (invalidTags.length > 0) {
        errors.push(`Invalid tags: ${invalidTags.join(', ')}`);
      }
    }

    // Validate audiences are valid
    if (content.target_audiences) {
      const validAudiences = this.TARGET_AUDIENCES.map(a => a.name);
      const invalidAudiences = content.target_audiences.filter(aud => !validAudiences.includes(aud));
      if (invalidAudiences.length > 0) {
        errors.push(`Invalid audiences: ${invalidAudiences.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Get content stats for dashboard
   */
  static getContentStats(contentArray) {
    const stats = {
      total: contentArray.length,
      byType: {},
      byAudience: {},
      byTag: {},
      byVisibility: {}
    };

    for (const content of contentArray) {
      // Count by type
      const type = content.opportunity_type || 'none';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count by audience
      for (const aud of content.target_audiences || []) {
        stats.byAudience[aud] = (stats.byAudience[aud] || 0) + 1;
      }

      // Count by tag
      for (const tag of content.tags || []) {
        stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
      }

      // Count by visibility
      stats.byVisibility[content.visibility] = (stats.byVisibility[content.visibility] || 0) + 1;
    }

    return stats;
  }

  /**
   * Get trending tags
   */
  static getTrendingTags(contentArray, limit = 10) {
    const tagCounts = {};

    for (const content of contentArray) {
      for (const tag of content.tags || []) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }

  /**
   * Get trending audiences
   */
  static getTrendingAudiences(contentArray, limit = 10) {
    const audienceCounts = {};

    for (const content of contentArray) {
      for (const aud of content.target_audiences || []) {
        audienceCounts[aud] = (audienceCounts[aud] || 0) + 1;
      }
    }

    return Object.entries(audienceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([audience, count]) => ({ audience, count }));
  }

  /**
   * Generate content summary for targeting
   */
  static generateTargetingSummary(content) {
    const typeInfo = this.getOpportunityType(content.opportunity_type || 'none');
    
    return {
      title: content.title,
      type: typeInfo?.label || 'Content',
      typeIcon: typeInfo?.icon || '📢',
      tags: content.tags || [],
      audiences: content.target_audiences || [],
      county: content.county,
      visibility: content.visibility,
      summary: `Targeting ${content.target_audiences?.length || 0} audiences with ${content.tags?.length || 0} tags`
    };
  }

  /**
   * Create content with smart targeting suggestions
   */
  static prepareContentForCreation(content) {
    return {
      ...content,
      suggestedAudiences: this.suggestAudiences(content.opportunity_type),
      suggestedTags: this.suggestTags(content),
      validation: this.validateTargeting(content)
    };
  }

  /**
   * Export targeting configuration for admin
   */
  static exportConfiguration() {
    return {
      tags: this.TAGS,
      opportunityTypes: this.OPPORTUNITY_TYPES,
      targetAudiences: this.TARGET_AUDIENCES,
      exportDate: new Date().toISOString()
    };
  }
}

// Export for use in other modules
export default ContentTargeting;
