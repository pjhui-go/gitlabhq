<script>
import { GlTabs, GlTab } from '@gitlab/ui';
import API from '~/api';
import { mergeUrlParams, updateHistory, getParameterValues } from '~/lib/utils/url_utility';
import PipelineCharts from './pipeline_charts.vue';

export default {
  components: {
    GlTabs,
    GlTab,
    PipelineCharts,
    DeploymentFrequencyCharts: () =>
      import('ee_component/dora/components/deployment_frequency_charts.vue'),
    LeadTimeCharts: () => import('ee_component/dora/components/lead_time_charts.vue'),
    ProjectQualitySummary: () => import('ee_component/project_quality_summary/app.vue'),
  },
  piplelinesTabEvent: 'p_analytics_ci_cd_pipelines',
  deploymentFrequencyTabEvent: 'p_analytics_ci_cd_deployment_frequency',
  leadTimeTabEvent: 'p_analytics_ci_cd_lead_time',
  inject: {
    shouldRenderDoraCharts: {
      type: Boolean,
      default: false,
    },
    shouldRenderQualitySummary: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selectedTab: 0,
    };
  },
  computed: {
    charts() {
      const chartsToShow = ['pipelines'];

      if (this.shouldRenderDoraCharts) {
        chartsToShow.push('deployment-frequency', 'lead-time');
      }

      if (this.shouldRenderQualitySummary) {
        chartsToShow.push('project-quality');
      }

      return chartsToShow;
    },
  },
  created() {
    this.selectTab();
    window.addEventListener('popstate', this.selectTab);
  },
  methods: {
    selectTab() {
      const [chart] = getParameterValues('chart') || this.charts;
      const tab = this.charts.indexOf(chart);
      this.selectedTab = tab >= 0 ? tab : 0;
    },
    onTabChange(index) {
      if (index !== this.selectedTab) {
        this.selectedTab = index;
        const path = mergeUrlParams({ chart: this.charts[index] }, window.location.pathname);
        updateHistory({ url: path, title: window.title });
      }
    },
    trackTabClick(tab) {
      API.trackRedisHllUserEvent(tab);
    },
  },
};
</script>
<template>
  <div>
    <gl-tabs v-if="charts.length > 1" :value="selectedTab" @input="onTabChange">
      <gl-tab
        :title="__('Pipelines')"
        data-testid="pipelines-tab"
        @click="trackTabClick($options.piplelinesTabEvent)"
      >
        <pipeline-charts />
      </gl-tab>
      <template v-if="shouldRenderDoraCharts">
        <gl-tab
          :title="__('Deployment frequency')"
          data-testid="deployment-frequency-tab"
          @click="trackTabClick($options.deploymentFrequencyTabEvent)"
        >
          <deployment-frequency-charts />
        </gl-tab>
        <gl-tab
          :title="__('Lead time')"
          data-testid="lead-time-tab"
          @click="trackTabClick($options.leadTimeTabEvent)"
        >
          <lead-time-charts />
        </gl-tab>
      </template>
      <gl-tab v-if="shouldRenderQualitySummary" :title="s__('QualitySummary|Project quality')">
        <project-quality-summary />
      </gl-tab>
    </gl-tabs>
    <pipeline-charts v-else />
  </div>
</template>
