import components/carousel
import gleam/dict
import gleam/result
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre/ui/button
import lustre/ui/classes
import lustre/ui/icon
import lustre/ui/input
import lustre_sandbox/lib
import lustre_sandbox/lib/msg.{type Msg, IntMessage}
import lustre_sandbox/lib/types.{type Model}

pub fn index(model: Model) -> Element(Msg) {
  html.div([classes.bg_app_subtle()], [
    html.div([], [
      ui.centre(
        [],
        html.p([classes.text_2xl()], [
          html.strong([], [html.em([], [element.text("INDEX")])]),
        ]),
      ),
      ui.centre(
        [classes.mt_md()],
        html.p([classes.font_mono(), classes.text_lg(), classes.pb_lg()], [
          element.text("lorem ipsum whatever my friend it's good to see you"),
        ]),
      ),
      html.div(
        [
          attribute.style([
            #("display", "flex"),
            #("justify-content", "center"),
            #("gap", "10px"),
          ]),
        ],
        [
          ui.button(
            [
              button.info(),
              button.solid(),
              attribute.style([#("width", "100px")]),
              event.on_click(IntMessage(msg.IntDecrement("icons"))),
            ],
            [element.text("-")],
          ),
          ui.button(
            [
              button.success(),
              button.solid(),
              attribute.style([#("width", "100px")]),
              event.on_click(IntMessage(msg.IntIncrement("icons"))),
            ],
            [element.text("+")],
          ),
        ],
      ),
    ]),
    ui.centre(
      [classes.my_lg()],
      html.div(
        [attribute.style([#("width", "full"), #("height", "4rem")])],
        lib.element_clones(
          result.unwrap(dict.get(model.state.ints, "icons"), 5),
          icon.sketch_logo([
            attribute.style([#("width", "4rem"), #("height", "4rem")]),
          ]),
        ),
      ),
    ),
    ui.centre(
      [classes.my_lg()],
      html.p([classes.text_4xl(), classes.font_alt()], [
        element.text("What is your name, my friend?"),
      ]),
    ),
    html.div(
      [
        attribute.style([
          #("display", "flex"),
          #("justify-content", "space-evenly"),
          #("align-items", "center"),
          #("gap", "4rem"),
        ]),
        classes.mx_5xl(),
        classes.pb_xl(),
      ],
      [
        html.div(
          [attribute.style([#("width", "100%"), #("min-width", "50%")])],
          [
            lib.input_box(model, "name", "[your name]", [
              classes.text_2xl(),
              attribute.style([
                #("width", "100%"),
                #("display", "flex"),
                #("justify-content", "center"),
                #("text-align", "center"),
              ]),
              input.primary(),
            ]),
          ],
        ),
        html.div(
          [attribute.style([#("width", "100%"), #("max-width", "50%")])],
          [
            html.p(
              [classes.text_2xl(), attribute.style([#("text-align", "center")])],
              [
                case dict.get(model.state.inputs, "name") {
                  Ok(value) if value != "" ->
                    element.text("What's up, " <> value <> "?")
                  _ -> element.text("What's up, [name]?")
                },
              ],
            ),
          ],
        ),
      ],
    ),
    html.div(
      [
        classes.pb_lg(),
        case dict.get(model.state.inputs, "colour") {
          Ok("red") -> attribute.style([#("background", "#882222")])
          _ -> attribute.none()
        },
      ],
      [carousel.carousel(model, "test", model.state.images)],
    ),
    html.div(
      [
        classes.bg_element_hover(),
        classes.pb_lg(),
        attribute.style([
          #("display", "flex"),
          #("flex-direction", "column"),
          #("justify-content", "center"),
          #("width", "100%"),
          #("align-items", "center"),
        ]),
      ],
      [
        html.p(
          [classes.text_2xl(), classes.p_lg(), classes.text_high_contrast()],
          [element.text("Input an image url below to load it on screen")],
        ),
        html.div([], [
          lib.input_box(model, "image_input", "[image_url]", [
            classes.text_2xl(),
            attribute.style([#("width", "full"), #("text-align", "center")]),
            input.primary(),
          ]),
        ]),
        html.div([], [
          case dict.get(model.state.inputs, "image_input") {
            Ok("") -> element.none()
            Ok(img) ->
              lib.imageloader(lib.to_imageref("input_image", img), 500, 600)
            _ -> element.none()
          },
        ]),
      ],
    ),
  ])
}
