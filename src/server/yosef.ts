import { Remult } from "remult";
import { getDataProvider } from "./getDataProvider";
import { sendMail } from "./sendMail";

getDataProvider().then(async dp => {
  const remult = new Remult();
  remult.setDataProvider(dp);
  await sendMail(789, 4);
});
