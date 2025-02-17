import { initReviewBar } from '~/batch_comments';
import initMrNotes from '~/mr_notes';
import store from '~/mr_notes/stores';
import initSidebarBundle from '~/sidebar/sidebar_bundle';
import initIssuableHeaderWarning from '~/issuable/init_issuable_header_warning';
import initShow from '../init_merge_request_show';

initMrNotes();
initShow();

requestIdleCallback(() => {
  initSidebarBundle(store);
  initReviewBar();
  initIssuableHeaderWarning(store);
});
