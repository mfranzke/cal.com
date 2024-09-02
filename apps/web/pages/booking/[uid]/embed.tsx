import { getServerSideProps as _getServerSideProps } from "@lib/booking/getServerSideProps";
import withEmbedSsr from "@lib/withEmbedSsr";

export { default } from "~/bookings/views/bookings-single-view";

export const getServerSideProps = withEmbedSsr(_getServerSideProps);
