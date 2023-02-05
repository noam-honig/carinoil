import { Remult } from "remult";
import { callRivhit, RivhitDocument } from "../app/create-invoice/invoice";
import { getDataProvider } from "./getDataProvider";
import { checkForNewOrdersOnSuperpharm } from "./superPhramOrders";

getDataProvider().then(async dp => {
  const remult = new Remult();
  remult.setDataProvider(dp);
  
  checkForNewOrdersOnSuperpharm(remult).then(x => {
    if (x) {
      console.log("x:", x)
    }else{
      console.log("there are no new orders.");
      
    }
  })
});
