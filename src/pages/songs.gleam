import lustre/element.{type Element}
import lustre/element/html
import lustre_sandbox/lib/types.{type Model}
import lustre_sandbox/lib/msg.{type Msg}

pub fn songs(model: Model) -> Element(Msg) {
  html.div([], [
    // get the songs, list them
    // make routes by id? or by song name?
  ])
}
