<script>
import { GlTabs, GlTab } from '@gitlab/ui';
import ServiceAccountsList from './service_accounts_list.vue';

export default {
  components: {
    GlTabs,
    GlTab,
    ServiceAccountsList,
  },
  props: {
    serviceAccounts: {
      type: Array,
      required: true,
    },
    createServiceAccountUrl: {
      type: String,
      required: true,
    },
    emptyIllustrationUrl: {
      type: String,
      required: true,
    },
  },
};
</script>

<template>
  <gl-tabs>
    <gl-tab :title="__('Configuration')">
      <service-accounts-list
        class="gl-mx-4"
        :list="serviceAccounts"
        :create-url="createServiceAccountUrl"
        :empty-illustration-url="emptyIllustrationUrl"
      />
    </gl-tab>
    <gl-tab :title="__('Deployments')" disabled />
    <gl-tab :title="__('Services')" disabled />
  </gl-tabs>
</template>
