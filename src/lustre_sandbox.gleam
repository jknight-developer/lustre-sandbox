import gleam/dict
import gleam/list
import gleam/result
import gleam/uri.{type Uri}
import lustre
import lustre/attribute.{type Attribute}
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import lustre/ui.{type Theme, Theme}
import lustre/ui/button
import lustre/ui/classes
import lustre/ui/colour
import lustre/ui/icon
import lustre/ui/input
import lustre/ui/prose
import lustre/ui/styles
import modem
import plinth/javascript/global

import lustre_sandbox/model.{type Model, Model}
import lustre_sandbox/state.{type State, State}
import lustre_sandbox/msg.{type Msg, CarouselMessage, IntMessage}
import lustre_sandbox/lib.{type ImageRef, ImageRef}
import components/carousel
import components/ints
import components/fizzbuzz

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

pub fn initial_state() {
  let theme = Theme(
    primary: colour.purple(),
    greyscale: colour.grey(),
    error: colour.red(),
    warning: colour.yellow(),
    success: colour.green(),
    info: colour.blue(),
  )
  State(
    route: msg.Index,
    theme: theme,
    inputs: dict.new(),
    ints: dict.from_list([#("icons", 5), #("fizzbuzz", 10)]),
    carousels: dict.new(),
  )
}

fn init(_) -> #(Model, Effect(Msg)) {
  #(
    Model(
      initial_state(),
    ),
    effect.batch([
      modem.init(on_url_change),
      set_interval(1000, IntMessage(msg.IntIncrement("fizzbuzz")))
    ])
  )
}

fn set_interval(interval: Int, msg: Msg) -> Effect(Msg) {
  effect.from(fn(dispatch) {
    global.set_interval(interval, fn() {
      dispatch(msg)
    })
    Nil
  })
}

fn on_url_change(uri: Uri) -> Msg {
  case uri.path_segments(uri.path) {
    ["index"] -> msg.OnRouteChange(msg.Index)
    ["about"] -> msg.OnRouteChange(msg.About)
    _ -> msg.OnRouteChange(msg.Index)
  }
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    msg.OnRouteChange(route) -> #(Model(State(..model.state, route: route)), effect.none())
    msg.StateReset -> #(Model(State(..initial_state(), route: model.state.route)), effect.none())
    msg.InputUpdate(name, value) -> #(Model(State(..model.state, inputs: dict.insert(model.state.inputs, name, value))), effect.none())
    msg.IntMessage(intmsg) -> ints.message_handler(model, intmsg)
    msg.CarouselMessage(carouselmsg) -> carousel.message_handler(model, carouselmsg)
  }
}

fn view(model: Model) -> Element(Msg) {
  let custom_styles = attribute.style([#("width", "full"), #("margin", "0 auto"), #("padding", "2rem")])
  let test_image = ImageRef(title: "stars", location: "https://images.unsplash.com/photo-1733103373160-003dc53ccdba?q=80&w=1987&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")
  let test_image2 = ImageRef(title: "street", location: "https://images.unsplash.com/photo-1731978009363-21fa723e2cbe?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")
  let local_image = ImageRef(title: "local", location: "./image.jpeg")
  let images = [test_image2, local_image, test_image]

  // welcome to lustre, it's react jsx but gleam
  html.div([], [
    ui.stack([attribute.id("container")],[
      styles.theme(model.state.theme),
      styles.elements(),
      html.div([], [
        navbar(model),
        // Routing
        html.div([custom_styles, attribute.style([#("background", result.unwrap(dict.get(model.state.inputs, "colour"), ""))])], [
          case model.state.route {
            msg.Index -> index(model)
            msg.About -> about(model)
          },
        ]),
        html.div([
          case dict.get(model.state.inputs, "colour") {
            Ok("red") -> attribute.style([#("background", "#882222")])
            _ -> attribute.none()
          }], 
          [carousel.carousel(model, "test", images)]
        ),
        ui.centre([], html.div([], [
          html.div([], [
            input_box(model, "image_input", "[image_input]", [classes.text_2xl(), attribute.style([#("width", "full")]), input.primary()]),
          ]),
          html.div([], [
            case dict.get(model.state.inputs, "image_input") {
              Ok("") -> element.none()
              Ok(img) -> lib.imageloader(lib.to_imageref("input_image", img), 500, 600)
              _ -> element.none()
            },
          ]),
        ])),
        footer(model),
      ])
    ])
  ])
}

fn navbar(model: Model) -> Element(Msg) {
  html.div([classes.shadow_md()], [
    ui.centre([], html.nav([], [
      html.a([attribute.href("/")], [
        ui.button([event.on_click(msg.InputUpdate("colour", ""))], [element.text("Index")]),
      ]),
      html.a([],[element.text(" | ")]),
      html.a([], [
        case dict.get(model.state.inputs, "colour") {
          Ok("red") -> ui.button([button.solid(), button.error(), event.on_click(msg.InputUpdate("colour", ""))], [element.text("RED MODE: ON ")])
          _ -> ui.button([button.solid(), button.error(), event.on_click(msg.InputUpdate("colour", "red"))], [element.text("RED MODE: OFF")])
        }
      ]),
      html.a([],[element.text(" | ")]),
      html.a([], [
        ui.button([button.solid(), button.info(), event.on_click(msg.StateReset)], [element.text("RESET")])
      ]),
      html.a([],[element.text(" | ")]),
      html.a([attribute.href("/about")], [
        ui.button([button.info(), button.outline(), button.warning()], [element.text("About")]),
      ]),
    ])),
    html.hr([attribute.style([#("opacity", "0")])]),
  ])
}

fn element_clones(amount: Int, element: Element(a)) -> List(Element(a)) {
  do_element_clones(amount, element, [])
}

fn do_element_clones(amount: Int, element: Element(a), acc: List(Element(a))) -> List(Element(a)) {
  case amount {
    x if x <= 0 -> acc
    _ -> do_element_clones(amount - 1, element, list.flatten([acc, [element]]))
  }
}

fn index(model: Model) -> Element(Msg) {
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
        element_clones(result.unwrap(dict.get(model.state.ints, "icons"), 5), icon.sketch_logo([attribute.style([#("width", "4rem"), #("height", "4rem")])]))
      )
    ),
    ui.centre([classes.my_lg()], html.p([classes.text_4xl(), classes.font_alt()], [element.text("What is your name my friend?")])),
    html.div([], [
    // State input using a dict
    ui.centre([], ui.aside([],
      input_box(model, "name", "[your text here]", [classes.text_2xl(), attribute.style([#("max-width", "50%")]), input.primary()]),
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

fn input_box(model: Model, name: String, placeholder: String, attrs: List(Attribute(Msg))) -> Element(Msg) {
  case dict.get(model.state.inputs, name) {
    Ok(item) if item != "" -> ui.input(list.flatten([[event.on_input(msg.InputUpdate(name, _))], [attribute.value(item)], attrs, [attribute.placeholder(placeholder)]]))
    _ -> ui.input(list.flatten([[event.on_input(msg.InputUpdate(name, _))], attrs, [attribute.placeholder(placeholder)]]))
  }
}

fn about(model: Model) -> Element(Msg) {
  html.div([attribute.style([#("min-height", "80rem")])], [
    ui.prose([prose.full()], [
      ui.centre([], html.h1([classes.pb_lg()], [element.text("TRAINING ARC")])),
    ]),
    ui.centre([button.warning(), classes.pb_lg()], ui.button([event.on_click(IntMessage(msg.IntIncrement("fizzbuzz")))], [html.p([classes.font_alt(), classes.text_5xl()], [element.text("MORE POWER")])])),
    html.div([classes.text_xl(), classes.font_mono(), attribute.style([#("display", "flex"), #("justify-content", "center")])],
      fizzbuzz.fizzbuzz(result.unwrap(dict.get(model.state.ints, "fizzbuzz"), 10)),
    ),
  ])
}

fn footer(model: Model) -> Element(Msg) {
  html.div([attribute.style([#("height", "5rem"), #("background", case dict.get(model.state.inputs, "colour") {
    Ok("red") -> "#552222"
    _ -> ""
  })])], [
    html.p([], [element.text("footer"),])
  ])
}

