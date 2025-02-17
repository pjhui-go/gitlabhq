import { GlTooltip, GlLink, GlIcon } from '@gitlab/ui';
import { shallowMount } from '@vue/test-utils';
import { TEST_HOST } from 'helpers/test_constants';
import Suggestion from '~/issues/suggestions/components/item.vue';
import UserAvatarImage from '~/vue_shared/components/user_avatar/user_avatar_image.vue';
import mockData from '../mock_data';

describe('Issuable suggestions suggestion component', () => {
  let wrapper;

  function createComponent(suggestion = {}) {
    wrapper = shallowMount(Suggestion, {
      propsData: {
        suggestion: {
          ...mockData(),
          ...suggestion,
        },
      },
    });
  }

  const findLink = () => wrapper.findComponent(GlLink);
  const findAuthorLink = () => wrapper.findAll(GlLink).at(1);
  const findIcon = () => wrapper.findComponent(GlIcon);
  const findTooltip = () => wrapper.findComponent(GlTooltip);
  const findUserAvatar = () => wrapper.findComponent(UserAvatarImage);

  afterEach(() => {
    wrapper.destroy();
  });

  it('renders title', () => {
    createComponent();

    expect(wrapper.text()).toContain('Test issue');
  });

  it('renders issue link', () => {
    createComponent();

    expect(findLink().attributes('href')).toBe(`${TEST_HOST}/test/issue/1`);
  });

  it('renders IID', () => {
    createComponent();

    expect(wrapper.text()).toContain('#1');
  });

  describe('opened state', () => {
    it('renders icon', () => {
      createComponent();

      expect(findIcon().props('name')).toBe('issue-open-m');
      expect(findIcon().attributes('class')).toMatch('gl-text-green-500');
    });

    it('renders created timeago', () => {
      createComponent({
        closedAt: '',
      });

      expect(findTooltip().text()).toContain('Opened');
      expect(findTooltip().text()).toContain('3 days ago');
    });
  });

  describe('closed state', () => {
    it('renders icon', () => {
      createComponent({
        state: 'closed',
      });

      expect(findIcon().props('name')).toBe('issue-close');
      expect(findIcon().attributes('class')).toMatch('gl-text-blue-500');
    });

    it('renders closed timeago', () => {
      createComponent();

      expect(findTooltip().text()).toContain('Opened');
      expect(findTooltip().text()).toContain('1 day ago');
    });
  });

  describe('author', () => {
    it('renders author info', () => {
      createComponent();

      expect(findAuthorLink().text()).toContain('Author Name');
      expect(findAuthorLink().text()).toContain('@author.username');
    });

    it('renders author image', () => {
      createComponent();

      expect(findUserAvatar().props('imgSrc')).toBe(`${TEST_HOST}/avatar`);
    });
  });

  describe('counts', () => {
    it('renders upvotes count', () => {
      createComponent();

      const count = wrapper.findAll('.suggestion-counts span').at(0);

      expect(count.text()).toContain('1');
      expect(count.find(GlIcon).props('name')).toBe('thumb-up');
    });

    it('renders notes count', () => {
      createComponent();

      const count = wrapper.findAll('.suggestion-counts span').at(1);

      expect(count.text()).toContain('2');
      expect(count.find(GlIcon).props('name')).toBe('comment');
    });
  });

  describe('confidential', () => {
    it('renders confidential icon', () => {
      createComponent({
        confidential: true,
      });

      expect(findIcon().props('name')).toBe('eye-slash');
      expect(findIcon().attributes('class')).toMatch('gl-text-orange-500');
      expect(findIcon().attributes('title')).toBe('Confidential');
    });
  });
});
