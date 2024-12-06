import lustre/ui/classes
import gleam/dict.{type Dict}
import gleam/int
import gleam/list
import gleam/result
import lustre/attribute
import lustre/effect
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import lustre/ui/icon
import lustre_sandbox/lib/msg.{type CarouselMsg, type Msg}
import lustre_sandbox/lib/types.{type ImageRef, type Model, type State, type CarouselState, CarouselState, State, Model}

pub fn message_handler(model: Model, carouselmsg: CarouselMsg) {
  case carouselmsg {
    msg.SetSlide(name, index) -> #(Model(State(..model.state, carousels: set_carousel_index(model, name, index))), effect.none())
    msg.NextSlide(name) -> #(Model(State(..model.state, carousels: increment_carousel_index(model, name))), effect.none())
    msg.PreviousSlide(name) -> #(Model(State(..model.state, carousels: decrement_carousel_index(model, name))), effect.none())
    msg.StartAutoSlide(name, interval) -> #(model, effect.none())
    msg.PauseAutoSlide(name) -> #(model, effect.none())
  }
}

pub fn set_carousel_index(model: Model, name: String, index: Int) -> Dict(String, CarouselState) {
  case result.unwrap(dict.get(model.state.carousels, name), CarouselState(0, [], #(False, 0))) {
    CarouselState(_, imgs, a) -> dict.insert(model.state.carousels, name, CarouselState(index, imgs, a))
  }
}

pub fn increment_carousel_index(model: Model, name: String) -> Dict(String, CarouselState) {
  let cstate = result.unwrap(dict.get(model.state.carousels, name), CarouselState(0, [], #(False, 0))) 
  case cstate, list.length(cstate.images) {
    CarouselState(n, imgs, a), length if n < length - 1 -> dict.insert(model.state.carousels, name, CarouselState(n + 1, imgs, a))
    CarouselState(_, imgs, a), _ -> dict.insert(model.state.carousels, name, CarouselState(0, imgs, a))
  }
}

pub fn decrement_carousel_index(model: Model, name: String) -> Dict(String, CarouselState) {
  let cstate = result.unwrap(dict.get(model.state.carousels, name), CarouselState(0, [], #(False, 0))) 
  case cstate, list.length(cstate.images) {
    CarouselState(n, imgs, a), _ if n > 0 -> dict.insert(model.state.carousels, name, CarouselState(n - 1, imgs, a))
    CarouselState(_, imgs, a), length -> dict.insert(model.state.carousels, name, CarouselState(length - 1, imgs, a))
  }
}

pub fn carousel(
  model: Model,
  name: String,
) -> Element(Msg) {
  let carousel_wrapper =
    attribute.style([
      #("position", "relative"),
      #("width", "40%"),
      #("max_width", "400px"),
      #("max-height", "300px"),
      #("margin", "0 auto"),
      #("overflow", "hidden"),
    ])
  // let transform_x
  let carousel_element =
    attribute.style([
      #("display", "flex"),
      #("transition", "transform 0.5s ease-in-out"),
      #("transform", "translateX(" <> int.to_string(result.unwrap(dict.get(model.state.carousels, name), CarouselState(0, [], #(True, 5000))).index * -100) <> "%)"),
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
  let carousel_dot =
    attribute.style([
      #("position", "absolute"),
      #("height", "40px"),
      #("width", "40px"),
      #("color", "white"),
      #("fill", "white"),
      #("border", "none"),
      #("padding", "10px 20px"),
      #("cursor", "pointer"),
      #("z-index", "2"),
    ])
  let carousel_dot_wrapper =
    attribute.style([
      #("display", "flex"),
      #("justify-content", "center"),
      #("width", "40px"),
      #("height", "40px"),
      #("text-align", "center"),
    ])
  let carousel_dots =
    attribute.style([
      #("display", "flex"),
      #("gap", "10px"),
      #("background-color", "rgba(0, 0, 0, 0.5)"),
      #("color", "white"),
      #("border", "none"),
      #("padding", "10px 20px"),
      #("cursor", "pointer"),
      #("z-index", "1"),
    ])
  let carousel_dots_wrapper =
    attribute.style([
      #("position", "absolute"),
      #("display", "flex"),
      #("justify-content", "center"),
      #("width", "100%"),
      #("bottom", "10px"),
    ])
  let images = result.unwrap(dict.get(model.state.carousels, name), CarouselState(0, [], #(False, 0))).images
  // wrapper
  html.div([carousel_wrapper], [
    // carousel
    html.div([carousel_element],
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
    html.button([carousel_button, event.on_click(msg.CarouselMessage(msg.PreviousSlide(name))), attribute.style([#("left", "10px")])], [
      icon.caret_left([]),
    ]),
    html.button([carousel_button, event.on_click(msg.CarouselMessage(msg.NextSlide(name))), attribute.style([#("right", "10px")])], [
      icon.caret_right([]),
    ]),
    // dots
    html.div([carousel_dots_wrapper], [
      html.div([carousel_dots],
        list.fold(list.range(1, list.length(images)), [], fn(dots, index) {
          list.append(dots, [html.div(
            [carousel_dot_wrapper], 
            [html.div([event.on_click(msg.CarouselMessage(msg.SetSlide(name, index - 1))), carousel_dot], [element.text(int.to_string(index))])]
          )])
        }),
      ),
    ])
  ])
}
