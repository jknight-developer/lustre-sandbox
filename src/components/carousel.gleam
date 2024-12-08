import gleam/dict.{type Dict}
import gleam/int
import gleam/list
import gleam/result
import lustre/attribute
import lustre/effect
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import lustre/ui/classes
import lustre/ui/icon
import lustre_sandbox/lib
import lustre_sandbox/lib/msg.{type CarouselMsg, type Msg}
import lustre_sandbox/lib/types.{
  type CarouselState, type ImageRef, type Model, type State, CarouselState,
  Model, State,
}

pub fn message_handler(model: Model, carouselmsg: CarouselMsg) {
  case carouselmsg {
    msg.SetSlide(name, index) -> #(
      Model(
        State(..model.state, carousels: set_carousel_index(model, name, index)),
      ),
      effect.none(),
    )
    msg.NextSlide(name) -> #(
      Model(
        State(..model.state, carousels: increment_carousel_index(model, name)),
      ),
      effect.none(),
    )
    msg.NextSlideIfAuto(name) -> #(
      Model(
        State(
          ..model.state,
          carousels: increment_carousel_index_if_auto(model, name),
        ),
      ),
      effect.none(),
    )
    msg.PreviousSlide(name) -> #(
      Model(
        State(..model.state, carousels: decrement_carousel_index(model, name)),
      ),
      effect.none(),
    )
    msg.StartAutoSlide(name, interval) -> #(
      Model(
        State(..model.state, carousels: start_auto_slide(model, name, interval)),
      ),
      effect.none(),
    )
    msg.PauseAutoSlide(name) -> #(
      Model(State(..model.state, carousels: pause_auto_slide(model, name))),
      effect.none(),
    )
  }
}

pub fn set_carousel_index(
  model: Model,
  name: String,
  index: Int,
) -> Dict(String, CarouselState) {
  case
    result.unwrap(
      dict.get(model.state.carousels, name),
      CarouselState(0, [], False),
    )
  {
    CarouselState(_, imgs, a) ->
      dict.insert(model.state.carousels, name, CarouselState(index, imgs, a))
  }
}

pub fn increment_carousel_index(
  model: Model,
  name: String,
) -> Dict(String, CarouselState) {
  let cstate =
    result.unwrap(
      dict.get(model.state.carousels, name),
      CarouselState(0, [], False),
    )
  case cstate, list.length(cstate.images) {
    CarouselState(n, imgs, a), length if n < length - 1 ->
      dict.insert(model.state.carousels, name, CarouselState(n + 1, imgs, a))
    CarouselState(_, imgs, a), _ ->
      dict.insert(model.state.carousels, name, CarouselState(0, imgs, a))
  }
}

pub fn increment_carousel_index_if_auto(
  model: Model,
  name: String,
) -> Dict(String, CarouselState) {
  let cstate =
    result.unwrap(
      dict.get(model.state.carousels, name),
      CarouselState(0, [], False),
    )
  case cstate, list.length(cstate.images) {
    CarouselState(n, imgs, b), length if n < length - 1 && b ->
      dict.insert(model.state.carousels, name, CarouselState(n + 1, imgs, b))
    CarouselState(_, imgs, b), _ if b ->
      dict.insert(model.state.carousels, name, CarouselState(0, imgs, b))
    _, _ -> model.state.carousels
  }
}

pub fn decrement_carousel_index(
  model: Model,
  name: String,
) -> Dict(String, CarouselState) {
  let cstate =
    result.unwrap(
      dict.get(model.state.carousels, name),
      CarouselState(0, [], False),
    )
  case cstate, list.length(cstate.images) {
    CarouselState(n, imgs, a), _ if n > 0 ->
      dict.insert(model.state.carousels, name, CarouselState(n - 1, imgs, a))
    CarouselState(_, imgs, a), length ->
      dict.insert(
        model.state.carousels,
        name,
        CarouselState(length - 1, imgs, a),
      )
  }
}

pub fn start_auto_slide(
  model: Model,
  name: String,
  interval: Int,
) -> Dict(String, CarouselState) {
  let cstate =
    result.unwrap(
      dict.get(model.state.carousels, name),
      CarouselState(0, [], False),
    )
  case cstate {
    CarouselState(n, imgs, _) ->
      dict.insert(model.state.carousels, name, CarouselState(n, imgs, True))
  }
}

pub fn pause_auto_slide(
  model: Model,
  name: String,
) -> Dict(String, CarouselState) {
  let cstate =
    result.unwrap(
      dict.get(model.state.carousels, name),
      CarouselState(0, [], False),
    )
  case cstate {
    CarouselState(n, imgs, _) ->
      dict.insert(model.state.carousels, name, CarouselState(n, imgs, False))
  }
}

pub fn carousel(model: Model, name: String) -> Element(Msg) {
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
      #(
        "transform",
        "translateX("
          <> int.to_string(
          result.unwrap(
            dict.get(model.state.carousels, name),
            CarouselState(0, [], True),
          ).index
          * -100,
        )
          <> "%)",
      ),
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
  let images =
    result.unwrap(
      dict.get(model.state.carousels, name),
      CarouselState(0, [], False),
    ).images
  // wrapper
  html.div(
    [
      carousel_wrapper,
      event.on_mouse_enter(msg.CarouselMessage(msg.PauseAutoSlide(name))),
      event.on_mouse_leave(msg.CarouselMessage(msg.StartAutoSlide(name, 0))),
    ],
    [
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
      html.button(
        [
          carousel_button,
          event.on_click(msg.CarouselMessage(msg.PreviousSlide(name))),
          attribute.style([#("left", "10px")]),
        ],
        [icon.caret_left([])],
      ),
      html.button(
        [
          carousel_button,
          event.on_click(msg.CarouselMessage(msg.NextSlide(name))),
          attribute.style([#("right", "10px")]),
        ],
        [icon.caret_right([])],
      ),
      // dots
      html.div([carousel_dots_wrapper], [
        html.div(
          [carousel_dots],
          list.fold(list.range(1, list.length(images)), [], fn(dots, index) {
            list.append(dots, [
              html.div([carousel_dot_wrapper], [
                html.div(
                  [
                    event.on_click(
                      msg.CarouselMessage(msg.SetSlide(name, index - 1)),
                    ),
                    carousel_dot,
                  ],
                  insert_dot(model, name, index),
                ),
              ]),
            ])
          }),
        ),
      ]),
    ],
  )
}

fn insert_dot(model: Model, carousel_name: String, index: Int) {
  case
    result.unwrap(
      dict.get(model.state.carousels, carousel_name),
      CarouselState(0, [], False),
    )
  {
    CarouselState(i, _, _) if i == index - 1 -> [
      html.strong([], [element.text(int.to_string(index))]),
    ]
    _ -> [element.text(int.to_string(index))]
  }
}
