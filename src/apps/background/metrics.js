import { clearTrackingEvents, resetTrackingTimer } from "../../redux/actions";
import config from "../../../config.json";

const shouldSendMetrics = (state) =>
  state.metadata.trackingTime &&
  (Date.now() - state.metadata.trackingTime) / 1000 > config.send_metrics_every_x_seconds &&
  state.metadata.tracking.length > 0;

const sendMetrics = (store) => {
  console.log("sending metrics");
  let state = store.getState();
  console.log("sending metrics to url: " + `${config.docamatic_api_url}/metrics`);
  console.log("with body");
  console.log(state.metadata.tracking);
  console.log("string ified");
  console.log(JSON.stringify(state.metadata.tracking));

  fetch(`${config.docamatic_api_url}/metrics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    mode: "cors",
    body: JSON.stringify(state.metadata.tracking),
  })
    .then((p) => {
      console.debug("successfully sent metrics");
      // clear out tracking items
      // reset timer
      store.dispatch(clearTrackingEvents());
      store.dispatch(resetTrackingTimer(Date.now()));
    })
    .catch((p) => {
      console.error("failed to send metrics");
      console.error(p);
    });
};

export const handleMetrics = (store) => {
  console.log("Seeing if I should send metrics");
  if (shouldSendMetrics(store.getState())) {
    console.log("Sending metrics because " + config.send_metrics_every_x_seconds + " has elapsed");
    sendMetrics(store);
  } else {
    console.log("not sending metrics");
  }
};
