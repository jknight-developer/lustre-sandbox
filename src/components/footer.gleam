import gleam/dict
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre_sandbox/lib/msg.{type Msg}
import lustre_sandbox/lib/types.{type Model}

pub fn footer(model: Model) -> Element(Msg) {
  html.div(
    [
      attribute.style([
        #("height", "5rem"),
        #("background", case dict.get(model.state.inputs, "colour") {
          Ok("red") -> "#552222"
          _ -> ""
        }),
      ]),
    ],
    [html.p([], [element.text("footer")])],
  )
}
