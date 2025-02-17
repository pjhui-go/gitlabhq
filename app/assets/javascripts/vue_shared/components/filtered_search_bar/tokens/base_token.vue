<script>
import {
  GlFilteredSearchToken,
  GlFilteredSearchSuggestion,
  GlDropdownDivider,
  GlDropdownSectionHeader,
  GlDropdownText,
  GlLoadingIcon,
} from '@gitlab/ui';
import { debounce } from 'lodash';

import { DEBOUNCE_DELAY, FILTER_NONE_ANY, OPERATOR_IS_NOT } from '../constants';
import { getRecentlyUsedSuggestions, setTokenValueToRecentlyUsed } from '../filtered_search_utils';

export default {
  components: {
    GlFilteredSearchToken,
    GlFilteredSearchSuggestion,
    GlDropdownDivider,
    GlDropdownSectionHeader,
    GlDropdownText,
    GlLoadingIcon,
  },
  props: {
    config: {
      type: Object,
      required: true,
    },
    value: {
      type: Object,
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
    },
    suggestionsLoading: {
      type: Boolean,
      required: false,
      default: false,
    },
    suggestions: {
      type: Array,
      required: false,
      default: () => [],
    },
    getActiveTokenValue: {
      type: Function,
      required: false,
      default: (suggestions, data) => suggestions.find(({ value }) => value === data),
    },
    defaultSuggestions: {
      type: Array,
      required: false,
      default: () => [],
    },
    preloadedSuggestions: {
      type: Array,
      required: false,
      default: () => [],
    },
    valueIdentifier: {
      type: String,
      required: false,
      default: 'id',
    },
    searchBy: {
      type: String,
      required: false,
      default: undefined,
    },
  },
  data() {
    return {
      searchKey: '',
      recentSuggestions: this.config.recentSuggestionsStorageKey
        ? getRecentlyUsedSuggestions(this.config.recentSuggestionsStorageKey)
        : [],
    };
  },
  computed: {
    isRecentSuggestionsEnabled() {
      return Boolean(this.config.recentSuggestionsStorageKey);
    },
    recentTokenIds() {
      return this.recentSuggestions.map((tokenValue) => tokenValue[this.valueIdentifier]);
    },
    preloadedTokenIds() {
      return this.preloadedSuggestions.map((tokenValue) => tokenValue[this.valueIdentifier]);
    },
    activeTokenValue() {
      return this.getActiveTokenValue(this.suggestions, this.value.data);
    },
    availableDefaultSuggestions() {
      if (this.value.operator === OPERATOR_IS_NOT) {
        return this.defaultSuggestions.filter(
          (suggestion) => !FILTER_NONE_ANY.includes(suggestion.value),
        );
      }
      return this.defaultSuggestions;
    },
    /**
     * Return all the suggestions when searchKey is present
     * otherwise return only the suggestions which aren't
     * present in "Recently used"
     */
    availableSuggestions() {
      return this.searchKey
        ? this.suggestions
        : this.suggestions.filter(
            (tokenValue) =>
              !this.recentTokenIds.includes(tokenValue[this.valueIdentifier]) &&
              !this.preloadedTokenIds.includes(tokenValue[this.valueIdentifier]),
          );
    },
    showDefaultSuggestions() {
      return this.availableDefaultSuggestions.length > 0;
    },
    showNoMatchesText() {
      return this.searchKey && !this.availableSuggestions.length;
    },
    showRecentSuggestions() {
      return (
        this.isRecentSuggestionsEnabled && this.recentSuggestions.length > 0 && !this.searchKey
      );
    },
    showPreloadedSuggestions() {
      return this.preloadedSuggestions.length > 0 && !this.searchKey;
    },
    showAvailableSuggestions() {
      return this.availableSuggestions.length > 0;
    },
    showSuggestions() {
      // These conditions must match the template under `#suggestions` slot
      // See https://gitlab.com/gitlab-org/gitlab/-/merge_requests/65817#note_632619411
      return (
        this.showDefaultSuggestions ||
        this.showRecentSuggestions ||
        this.showPreloadedSuggestions ||
        this.suggestionsLoading ||
        this.showAvailableSuggestions
      );
    },
    searchTerm() {
      return this.searchBy && this.activeTokenValue
        ? this.activeTokenValue[this.searchBy]
        : undefined;
    },
  },
  watch: {
    active: {
      immediate: true,
      handler(newValue) {
        if (!newValue && !this.suggestions.length) {
          const search = this.searchTerm ? this.searchTerm : this.value.data;
          this.$emit('fetch-suggestions', search);
        }
      },
    },
  },
  methods: {
    handleInput: debounce(function debouncedSearch({ data }) {
      this.searchKey = data;

      if (!this.suggestionsLoading && !this.activeTokenValue) {
        const search = this.searchTerm ? this.searchTerm : data;
        this.$emit('fetch-suggestions', search);
      }
    }, DEBOUNCE_DELAY),
    handleTokenValueSelected(selectedValue) {
      const activeTokenValue = this.getActiveTokenValue(this.suggestions, selectedValue);

      // Make sure that;
      // 1. Recently used values feature is enabled
      // 2. User has actually selected a value
      // 3. Selected value is not part of preloaded list.
      if (
        this.isRecentSuggestionsEnabled &&
        activeTokenValue &&
        !this.preloadedTokenIds.includes(activeTokenValue[this.valueIdentifier])
      ) {
        setTokenValueToRecentlyUsed(this.config.recentSuggestionsStorageKey, activeTokenValue);
      }
    },
  },
};
</script>

<template>
  <gl-filtered-search-token
    :config="config"
    :value="value"
    :active="active"
    v-bind="$attrs"
    v-on="$listeners"
    @input="handleInput"
    @select="handleTokenValueSelected"
  >
    <template #view-token="viewTokenProps">
      <slot name="view-token" :view-token-props="{ ...viewTokenProps, activeTokenValue }"></slot>
    </template>
    <template #view="viewTokenProps">
      <slot name="view" :view-token-props="{ ...viewTokenProps, activeTokenValue }"></slot>
    </template>
    <template v-if="showSuggestions" #suggestions>
      <template v-if="showDefaultSuggestions">
        <gl-filtered-search-suggestion
          v-for="token in availableDefaultSuggestions"
          :key="token.value"
          :value="token.value"
        >
          {{ token.text }}
        </gl-filtered-search-suggestion>
        <gl-dropdown-divider />
      </template>
      <template v-if="showRecentSuggestions">
        <gl-dropdown-section-header>{{ __('Recently used') }}</gl-dropdown-section-header>
        <slot name="suggestions-list" :suggestions="recentSuggestions"></slot>
        <gl-dropdown-divider />
      </template>
      <slot
        v-if="showPreloadedSuggestions"
        name="suggestions-list"
        :suggestions="preloadedSuggestions"
      ></slot>
      <gl-loading-icon v-if="suggestionsLoading" size="sm" />
      <gl-dropdown-text v-else-if="showNoMatchesText">
        {{ __('No matches found') }}
      </gl-dropdown-text>
      <template v-else>
        <slot name="suggestions-list" :suggestions="availableSuggestions"></slot>
      </template>
    </template>
  </gl-filtered-search-token>
</template>
