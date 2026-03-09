import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/ar";
dayjs.locale("ar");
dayjs.extend(utc);
dayjs.extend(timezone);

export { dayjs };
export default dayjs;
