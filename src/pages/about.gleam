import gleam/dict
import gleam/result
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre/ui/button
import lustre/ui/classes
import lustre/ui/prose
import lustre_sandbox/lib/types.{type Model}
import lustre_sandbox/lib/msg.{type Msg}
import components/fizzbuzz

pub fn about(model: Model) -> Element(Msg) {
  html.div([attribute.style([#("min-height", "80rem")])], [
    ui.prose([prose.full()], [
      ui.centre([], html.h1([classes.pb_lg()], [element.text("TRAINING ARC")])),
    ]),
    ui.centre([button.warning(), classes.pb_lg()], ui.button([event.on_click(msg.IntMessage(msg.IntIncrement("fizzbuzz")))], [html.p([classes.font_alt(), classes.text_5xl()], [element.text("MORE POWER")])])),
    html.div([classes.text_xl(), classes.font_mono(), attribute.style([#("display", "flex"), #("justify-content", "center")])],
      fizzbuzz.fizzbuzz(result.unwrap(dict.get(model.state.ints, "fizzbuzz"), 10)),
    ),
  ])
}

