<script>
import { GlButton, GlModalDirective, GlSafeHtmlDirective as SafeHtml } from '@gitlab/ui';
import { mapState, mapActions, mapGetters } from 'vuex';
import glFeatureFlagsMixin from '~/vue_shared/mixins/gl_feature_flags_mixin';
import {
  TEST_INTEGRATION_EVENT,
  SAVE_INTEGRATION_EVENT,
  integrationLevels,
} from '~/integrations/constants';
import eventHub from '../event_hub';

import ActiveCheckbox from './active_checkbox.vue';
import ConfirmationModal from './confirmation_modal.vue';
import DynamicField from './dynamic_field.vue';
import JiraIssuesFields from './jira_issues_fields.vue';
import JiraTriggerFields from './jira_trigger_fields.vue';
import OverrideDropdown from './override_dropdown.vue';
import ResetConfirmationModal from './reset_confirmation_modal.vue';
import TriggerFields from './trigger_fields.vue';

export default {
  name: 'IntegrationForm',
  components: {
    OverrideDropdown,
    ActiveCheckbox,
    JiraTriggerFields,
    JiraIssuesFields,
    TriggerFields,
    DynamicField,
    ConfirmationModal,
    ResetConfirmationModal,
    GlButton,
  },
  directives: {
    GlModal: GlModalDirective,
    SafeHtml,
  },
  mixins: [glFeatureFlagsMixin()],
  props: {
    formSelector: {
      type: String,
      required: true,
    },
    helpHtml: {
      type: String,
      required: false,
      default: '',
    },
  },
  data() {
    return {
      integrationActive: false,
    };
  },
  computed: {
    ...mapGetters(['currentKey', 'propsSource', 'isDisabled']),
    ...mapState([
      'defaultState',
      'customState',
      'override',
      'isSaving',
      'isTesting',
      'isResetting',
    ]),
    isEditable() {
      return this.propsSource.editable;
    },
    isJira() {
      return this.propsSource.type === 'jira';
    },
    isInstanceOrGroupLevel() {
      return (
        this.customState.integrationLevel === integrationLevels.INSTANCE ||
        this.customState.integrationLevel === integrationLevels.GROUP
      );
    },
    showReset() {
      return this.isInstanceOrGroupLevel && this.propsSource.resetPath;
    },
  },
  mounted() {
    // this form element is defined in Haml
    this.form = document.querySelector(this.formSelector);
  },
  methods: {
    ...mapActions([
      'setOverride',
      'setIsSaving',
      'setIsTesting',
      'setIsResetting',
      'fetchResetIntegration',
      'requestJiraIssueTypes',
    ]),
    onSaveClick() {
      this.setIsSaving(true);

      const formValid = this.form.checkValidity() || this.integrationActive === false;
      eventHub.$emit(SAVE_INTEGRATION_EVENT, formValid);
    },
    onTestClick() {
      this.setIsTesting(true);

      const formValid = this.form.checkValidity();
      eventHub.$emit(TEST_INTEGRATION_EVENT, formValid);
    },
    onResetClick() {
      this.fetchResetIntegration();
    },
    onRequestJiraIssueTypes() {
      const formData = new FormData(this.form);
      this.requestJiraIssueTypes(formData);
    },
    onToggleIntegrationState(integrationActive) {
      this.integrationActive = integrationActive;
      if (!this.form) {
        return;
      }

      // If integration will be active, enable form validation.
      if (integrationActive) {
        this.form.removeAttribute('novalidate');
      } else {
        this.form.setAttribute('novalidate', true);
      }
    },
  },
  helpHtmlConfig: {
    ADD_ATTR: ['target'], // allow external links, can be removed after https://gitlab.com/gitlab-org/gitlab-ui/-/issues/1427 is implemented
    ADD_TAGS: ['use'], // to support icon SVGs
    FORBID_ATTR: [], // This is trusted input so we can override the default config to allow data-* attributes
  },
};
</script>

<template>
  <div class="gl-mb-3">
    <override-dropdown
      v-if="defaultState !== null"
      :inherit-from-id="defaultState.id"
      :override="override"
      :learn-more-path="propsSource.learnMorePath"
      @change="setOverride"
    />

    <div class="row">
      <div class="col-lg-4"></div>

      <div class="col-lg-8">
        <!-- helpHtml is trusted input -->
        <div v-if="helpHtml" v-safe-html:[$options.helpHtmlConfig]="helpHtml"></div>

        <active-checkbox
          v-if="propsSource.showActive"
          :key="`${currentKey}-active-checkbox`"
          @toggle-integration-active="onToggleIntegrationState"
        />
        <jira-trigger-fields
          v-if="isJira"
          :key="`${currentKey}-jira-trigger-fields`"
          v-bind="propsSource.triggerFieldsProps"
        />
        <trigger-fields
          v-else-if="propsSource.triggerEvents.length"
          :key="`${currentKey}-trigger-fields`"
          :events="propsSource.triggerEvents"
          :type="propsSource.type"
        />
        <dynamic-field
          v-for="field in propsSource.fields"
          :key="`${currentKey}-${field.name}`"
          v-bind="field"
        />
        <jira-issues-fields
          v-if="isJira && !isInstanceOrGroupLevel"
          :key="`${currentKey}-jira-issues-fields`"
          v-bind="propsSource.jiraIssuesProps"
          @request-jira-issue-types="onRequestJiraIssueTypes"
        />
        <div v-if="isEditable" class="footer-block row-content-block">
          <template v-if="isInstanceOrGroupLevel">
            <gl-button
              v-gl-modal.confirmSaveIntegration
              category="primary"
              variant="confirm"
              :loading="isSaving"
              :disabled="isDisabled"
              data-qa-selector="save_changes_button"
            >
              {{ __('Save changes') }}
            </gl-button>
            <confirmation-modal @submit="onSaveClick" />
          </template>
          <gl-button
            v-else
            category="primary"
            variant="confirm"
            type="submit"
            :loading="isSaving"
            :disabled="isDisabled"
            data-testid="save-button"
            data-qa-selector="save_changes_button"
            @click.prevent="onSaveClick"
          >
            {{ __('Save changes') }}
          </gl-button>

          <gl-button
            v-if="propsSource.canTest"
            category="secondary"
            variant="confirm"
            :loading="isTesting"
            :disabled="isDisabled"
            :href="propsSource.testPath"
            data-testid="test-button"
            @click.prevent="onTestClick"
          >
            {{ __('Test settings') }}
          </gl-button>

          <template v-if="showReset">
            <gl-button
              v-gl-modal.confirmResetIntegration
              category="secondary"
              variant="confirm"
              :loading="isResetting"
              :disabled="isDisabled"
              data-testid="reset-button"
            >
              {{ __('Reset') }}
            </gl-button>
            <reset-confirmation-modal @reset="onResetClick" />
          </template>

          <gl-button :href="propsSource.cancelPath">{{ __('Cancel') }}</gl-button>
        </div>
      </div>
    </div>
  </div>
</template>
