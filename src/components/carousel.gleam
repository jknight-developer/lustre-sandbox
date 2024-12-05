import gleam/list
import lustre/attribute
import lustre/effect
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import lustre/ui/icon
import lustre_sandbox/lib/msg.{type CarouselMsg, type Msg}
import lustre_sandbox/lib/types.{type ImageRef, type Model}

pub fn message_handler(model: Model, carouselmsg: CarouselMsg) {
  case carouselmsg {
    _ -> #(model, effect.none())
  }
}

pub fn carousel(
  model: Model,
  name: String,
  images: List(ImageRef),
) -> Element(Msg) {
  let carousel_wrapper =
    attribute.style([
      #("position", "relative"),
      #("width", "80%"),
      #("max_width", "800px"),
      #("max-height", "600px"),
      #("margin", "0 auto"),
      #("overflow", "hidden"),
    ])
  let carousel_element =
    attribute.style([
      #("display", "flex"),
      #("transition", "transform 0.5s ease-in-out"),
    ])
  let carousel_button =
    attribute.style([
      #("position", "absolute"),
      #("top", "50%"),
      #("transform", "translateY(-50%)"),
      #("background-color", "rgba(0, 0, 0, 0.5)"),
      #("color", "white"),
      #("border", "none"),
      #("padding", "10px 20px"),
      #("cursor", "pointer"),
      #("z-index", "1"),
    ])
  // wrapper
  html.div([carousel_wrapper], [
    // carousel
    html.div(
      [carousel_element],
      // image elements
      list.map(images, fn(image) {
        html.img([
          attribute.src(image.location),
          attribute.alt(image.title),
          attribute.style([#("width", "100%"), #("flex-shrink", "0")]),
        ])
      }),
    ),
    // buttons
    html.button([carousel_button, attribute.style([#("left", "10px")])], [
      icon.caret_left([]),
    ]),
    html.button([carousel_button, attribute.style([#("right", "10px")])], [
      icon.caret_right([]),
    ]),
    // TODO: dots
    html.div([], []),
  ])
}
