import gleam/dict
import gleam/result
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/ui
import lustre/ui/input
import lustre/ui/classes
import lustre_sandbox/lib
import lustre_sandbox/lib/types.{type Model}
import lustre_sandbox/lib/msg.{type Msg}
import components/carousel
import components/footer
import components/navbar
import pages/index
import pages/about


pub fn app(model: Model) -> Element(Msg) {
  html.div([], [
    navbar.navbar(model),
    // Routing
    html.div(
      [
        attribute.style([
          #("width", "full"),
          #("margin", "0 auto"),
          #("padding", "2rem"),
          #(
            "background",
            result.unwrap(dict.get(model.state.inputs, "colour"), ""),
          ),
        ]),
      ],
      [
        case model.state.route {
          msg.Index -> index.index(model)
          msg.About -> about.about(model)
        },
      ],
    ),
    html.div(
      [
        case dict.get(model.state.inputs, "colour") {
          Ok("red") -> attribute.style([#("background", "#882222")])
          _ -> attribute.none()
        },
      ],
      [carousel.carousel(model, "test", model.state.images)],
    ),
    ui.centre(
      [],
      html.div([], [
        html.div([], [
          lib.input_box(model, "image_input", "[image_input]", [
            classes.text_2xl(),
            attribute.style([#("width", "full")]),
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
      ]),
    ),
    footer.footer(model),
  ])
}
