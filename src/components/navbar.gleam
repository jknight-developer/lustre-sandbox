import gleam/dict
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre/ui/button
import lustre/ui/classes
import lustre_sandbox/lib/msg.{type Msg}
import lustre_sandbox/lib/types.{type Model}

pub fn navbar(model: Model) -> Element(Msg) {
  html.div([classes.shadow_md(), classes.py_md()], [
    ui.centre(
      [],
      html.nav([], [
        html.a([attribute.href("/lustre-sandbox/")], [
          ui.button([event.on_click(msg.InputUpdate("colour", ""))], [
            element.text("Index"),
          ]),
        ]),
        html.a([], [element.text(" | ")]),
        html.a([], [
          case dict.get(model.state.inputs, "colour") {
            Ok("red") ->
              ui.button(
                [
                  button.solid(),
                  button.error(),
                  event.on_click(msg.InputUpdate("colour", "")),
                ],
                [element.text("RED MODE: ON ")],
              )
            _ ->
              ui.button(
                [
                  button.solid(),
                  button.error(),
                  event.on_click(msg.InputUpdate("colour", "red")),
                ],
                [element.text("RED MODE: OFF")],
              )
          },
        ]),
        html.a([], [element.text(" | ")]),
        html.a([], [
          ui.button(
            [button.solid(), button.info(), event.on_click(msg.StateReset)],
            [element.text("RESET")],
          ),
        ]),
        html.a([], [element.text(" | ")]),
        html.a([attribute.href("/lustre-sandbox/about")], [
          ui.button([button.info(), button.outline(), button.warning()], [
            element.text("About"),
          ]),
        ]),
        html.a([], [element.text(" | ")]),
        html.a([attribute.href("/lustre-sandbox/songs")], [
          ui.button([button.greyscale(), button.outline()], [
            element.text("Songs"),
          ]),
        ]),
      ]),
    ),
    html.hr([attribute.style([#("opacity", "0")])]),
  ])
}
