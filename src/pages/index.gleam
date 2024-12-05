import gleam/dict
import gleam/result
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre/ui/classes
import lustre/ui/icon
import lustre/ui/input
import lustre_sandbox/lib/types.{type Model}
import lustre_sandbox/lib/msg.{type Msg, IntMessage}
import lustre_sandbox/lib

pub fn index(model: Model) -> Element(Msg) {
  html.div([], [
    html.div([], [
      ui.centre([], html.p([classes.text_md()], [element.text("INDEX")])),
      ui.centre([classes.mt_md()], html.p([classes.font_mono(), classes.text_lg()], [element.text("lorem ipsum whatever man who cares")])),
      html.div([attribute.style([#("display", "flex")])], [ 
        ui.button([event.on_click(IntMessage(msg.IntDecrement("icons")))], [element.text("-")]),
        ui.button([event.on_click(IntMessage(msg.IntIncrement("icons")))], [element.text("+")]),
      ]),
    ]),
    ui.centre(
      [classes.my_lg()], 
      html.div(
        [attribute.style([#("width", "full"), #("height", "4rem")])], 
        lib.element_clones(result.unwrap(dict.get(model.state.ints, "icons"), 5), icon.sketch_logo([attribute.style([#("width", "4rem"), #("height", "4rem")])]))
      )
    ),
    ui.centre([classes.my_lg()], html.p([classes.text_4xl(), classes.font_alt()], [element.text("What is your name my friend?")])),
    html.div([], [
    // State input using a dict
    ui.centre([], ui.aside([],
      lib.input_box(model, "name", "[your text here]", [classes.text_2xl(), attribute.style([#("max-width", "50%")]), input.primary()]),
      ui.centre([], 
        html.p([classes.text_2xl()], [case dict.get(model.state.inputs, "name") {
          Ok(value) if value != "" -> element.text("What's up, " <> value <> "?")
          _ -> element.text("What's up, [name]?")
        }])
      ),
    )),
    ]),
  ])
}

