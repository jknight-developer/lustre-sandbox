import gleam/dict.{type Dict}
import gleam/int
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
import lustre/ui/aside
import lustre/ui/box
import lustre/ui/button
import lustre/ui/classes
import lustre/ui/colour
import lustre/ui/icon
import lustre/ui/input
import lustre/ui/prose
import lustre/ui/styles
import modem

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

pub type Route {
  Index
  About
}

pub type FileName = String
pub type FilePath = String

pub type State {
  State(inputs: Dict(String, String), ints: Dict(String, Int))
}


pub type Model {
  Model(route: Route, state: State, theme: Theme)
}

fn init(_) -> #(Model, Effect(Msg)) {
  let theme = Theme(
    primary: colour.purple(),
    greyscale: colour.grey(),
    error: colour.red(),
    warning: colour.yellow(),
    success: colour.green(),
    info: colour.blue(),
  )

  let ints_dict = dict.from_list([#("icons", 5)])

  #(Model(Index, State(inputs: dict.new(), ints: ints_dict), theme), modem.init(on_url_change))
}

fn on_url_change(uri: Uri) -> Msg {
  case uri.path_segments(uri.path) {
    ["index"] -> OnRouteChange(Index)
    ["about"] -> OnRouteChange(About)
    _ -> OnRouteChange(Index)
  }
}

type CanvasAction {
}

type Msg {
  OnRouteChange(Route)
  CanvasDraw(CanvasAction)
  InputUpdate(String, String)
  InputIncrement(String)
  InputDecrement(String)
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case model {
    Model(current_route, state, theme) -> {
      case msg {
        OnRouteChange(route) -> #(Model(route, state, theme), effect.none())
        CanvasDraw(_action) -> #(Model(current_route, state, theme), effect.none())
        InputUpdate(name, value) -> #(Model(current_route, State(inputs: dict.insert(state.inputs, name, value), ints: state.ints), theme), effect.none())
        InputIncrement(name) -> #(Model(current_route, State(inputs: state.inputs, ints: dict.map_values(state.ints, fn(_k: String, v: Int) {v + 1})), theme), effect.none())
        InputDecrement(name) -> #(Model(current_route, State(inputs: state.inputs, ints: dict.map_values(state.ints, fn(_k: String, v: Int) {v - 1})), theme), effect.none())
      }
    }
  }
}

fn view(model: Model) -> Element(Msg) {
  let custom_styles = attribute.style([#("width", "full"), #("margin", "0 auto"), #("padding", "2rem")])
  let _test_image = ImageRef(title: "mario", location: "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:yvf7rm2mjqk4vy676fedjjra/bafkreieu7hcksyvq7k2cwyipm57pgzetdepf44a2hyrjbrrgeegqnknx7y@jpeg")
  let local_image = ImageRef(title: "local", location: "./image.jpeg")
  let images = [local_image]

  // welcome to lustre, it's react jsx but gleam
  html.div([], [
    ui.stack([attribute.id("container")],[
      styles.theme(model.theme),
      styles.elements(),
      html.div([], [
        navbar(),
        // Routing
        html.div([custom_styles, attribute.style([#("background", result.unwrap(dict.get(model.state.inputs, "colour"), ""))])], [
          case model {
            Model(Index, _, _) -> index(model)
            Model(About, _, _) -> about(model)
          },
        ]),
        html.div([
          case dict.get(model.state.inputs, "colour") {
            Ok("red") -> attribute.style([#("background", "green")])
            _ -> attribute.none()
          }], 
          [carousel(images)]),
        html.br([]),
        footer(),
      ])
    ])
  ])
}

// fn canvas() -> Element(Msg) {
//   ui.centre([], 
//     html.canvas([
//       attribute.id("canvas"), 
//       attribute.style([
//         #("border", "1px solid #d3d3d3"), 
//         #("background-color", "#f1f1f1"), 
//         #("width", "50ch")
//       ]), 
//       event.on_click(canvas_event(Circle))
//     ]),
//   )
// }

// fn canvas_event(action: CanvasAction) -> Msg {
//   CanvasDraw(action)
// }

fn navbar() -> Element(Msg) {
  html.div([classes.shadow_md()], [
    ui.centre([], html.nav([], [
      html.a([attribute.href("/")], [
        ui.button([event.on_click(InputUpdate("colour", ""))], [element.text("Index")]),
      ]),
      html.a([],[element.text(" | ")]),
      html.a([attribute.href("/")], [
        ui.button([button.solid(), button.error(), event.on_click(InputUpdate("colour", "red"))], [element.text("Index but RED")]),
      ]),
      html.a([],[element.text(" | ")]),
      html.a([attribute.href("/about")], [
        ui.button([button.info(), button.outline(), button.warning()], [element.text("About")]),
      ]),
    ])),
    html.hr([attribute.style([#("opacity", "0")])]),
  ])
}

type ImageRef {
  ImageRef(title: String, location: String)
}

fn carousel(images: List(ImageRef)) -> Element(Msg) {
  // carousel location
  html.div([], [
    // carousel wrapper
    ui.centre([], html.div([box.packed()], [
      // image wrapper, (copy for now, then change to a db/file read loop maybe in a function)
      case images {
        [first, .._rest] -> {
          html.div([], [
            imageloader(first),
          ])
        }
        _ -> element.none()
      }
    ])),
  ])
}

// fn raw_image(source: String) -> Element(Msg) {
//   imageloader(ImageRef(title: "image", location: source))
// }

fn imageloader(image: ImageRef) -> Element(Msg) {
  html.div([], [
    html.img([attribute.src(image.location), attribute.alt(image.title), attribute.width(500), attribute.height(600)]),
  ])
}

fn fizzbuzz(num: Int) -> List(Element(Msg)) {
  do_fizzbuzz(num, 1, [])
}

fn do_fizzbuzz(num: Int, acc: Int, textlist: List(Element(Msg))) -> List(Element(Msg)) {
  case acc {
    n if n == num + 1 -> textlist
    n if n >= 0 && n % 15 == 0 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [element.text("fizzbuzz ")]]))
    n if n >= 0 && n % 3 == 0 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [element.text("fizz ")]]))
    n if n >= 0 && n % 5 == 0 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [element.text("buzz ")]]))
    n if n >= 0 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [element.text(int.to_string(acc) <> " ")]]))
    _ -> panic
  }
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
    ui.aside([],
      ui.button([event.on_click(InputDecrement("icons"))], [element.text("-")]),
      ui.button([event.on_click(InputIncrement("icons"))], [element.text("+")]),
    ),
    ui.centre(
      [classes.my_lg()], 
      html.div(
        [attribute.style([#("width", "full"), #("height", "4rem")])], 
        element_clones(result.unwrap(dict.get(model.state.ints, "icons"), 5), icon.sketch_logo([attribute.style([#("width", "4rem"), #("height", "4rem")])]))
      )
    ),
    ui.centre([classes.my_lg()], html.p([classes.text_4xl(), classes.font_alt()], [element.text("What is your name my friend?")])),
    ]),
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
    Ok(item) if item != "" -> ui.input(list.flatten([[event.on_input(InputUpdate(name, _))], [attribute.value(item)], attrs, [attribute.placeholder(placeholder)]]))
    _ -> ui.input(list.flatten([[event.on_input(InputUpdate(name, _))], attrs, [attribute.placeholder(placeholder)]]))
  }
}

fn about(_model: Model) -> Element(Msg) {
  html.div([], [
    ui.prose([prose.full()], [
      ui.centre([], html.h1([], [element.text("ABOUT ME")])),
    ]),
    html.div([classes.text_xl(), classes.font_mono()],
      fizzbuzz(666),
    ),
  ])
}

fn footer() -> Element(Msg) {
  html.div([], [
    element.text("footer"),
  ])
}
