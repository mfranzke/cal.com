import { withAppDirSsr } from "app/WithAppDirSsr";
import withEmbedSsrAppDir from "app/WithEmbedSSR";
import { WithLayout } from "app/layoutHOC";

import { getServerSideProps, type PageProps } from "@lib/booking/getServerSideProps";

import OldPage from "~/bookings/views/bookings-single-view";

const getData = withAppDirSsr<PageProps>(getServerSideProps);

const getEmbedData = withEmbedSsrAppDir(getData);

export default WithLayout({ getLayout: null, getData: getEmbedData, Page: OldPage });
