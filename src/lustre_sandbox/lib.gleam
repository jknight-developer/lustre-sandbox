import gleam/dict
import gleam/list
import lustre/attribute.{type Attribute}
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre_sandbox/lib/msg.{type Msg}
import lustre_sandbox/lib/types.{type ImageRef, type Model, ImageRef}
import plinth/javascript/global

pub fn set_interval(interval: Int, msg: Msg) -> Effect(Msg) {
  effect.from(fn(dispatch) {
    global.set_interval(interval, fn() { dispatch(msg) })
    Nil
  })
}

pub fn to_imageref(title: String, location: String) -> ImageRef {
  ImageRef(title, location)
}

pub fn imageloader(image: ImageRef, width: Int, height: Int) -> Element(Msg) {
  html.div([attribute.style([#("display", "flex"), #("flex-grow", "4")])], [
    html.img([
      attribute.src(image.location),
      attribute.alt(image.title),
      attribute.width(width),
      attribute.height(height),
    ]),
  ])
}

pub fn element_clones(amount: Int, element: Element(a)) -> List(Element(a)) {
  do_element_clones(amount, element, [])
}

pub fn do_element_clones(
  amount: Int,
  element: Element(a),
  acc: List(Element(a)),
) -> List(Element(a)) {
  case amount {
    x if x <= 0 -> acc
    _ -> do_element_clones(amount - 1, element, list.flatten([acc, [element]]))
  }
}

pub fn input_box(
  model: Model,
  name: String,
  placeholder: String,
  attrs: List(Attribute(Msg)),
) -> Element(Msg) {
  case dict.get(model.state.inputs, name) {
    Ok(item) if item != "" ->
      ui.input(
        list.flatten([
          [event.on_input(msg.InputUpdate(name, _))],
          [attribute.value(item)],
          attrs,
          [attribute.placeholder(placeholder)],
        ]),
      )
    _ ->
      ui.input(
        list.flatten([
          [event.on_input(msg.InputUpdate(name, _))],
          attrs,
          [attribute.placeholder(placeholder)],
        ]),
      )
  }
}
