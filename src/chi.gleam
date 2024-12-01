import gleam/dict.{type Dict}
import gleam/int
import gleam/float
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
import lustre/ui/centre
import lustre/ui/classes
import lustre/ui/colour
import lustre/ui/icon
import lustre/ui/input
import lustre/ui/prose
import lustre/ui/styles
import modem
import plinth/javascript/global

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

  let ints_dict = dict.from_list([#("icons", 5), #("fizzbuzz", 10)])

  #(Model(Index, State(inputs: dict.new(), ints: ints_dict), theme), effect.batch([modem.init(on_url_change), clock(InputIncrement("fizzbuzz"))]))
}

fn clock(msg: Msg) -> Effect(Msg) {
  effect.from(fn(dispatch) {
    global.set_interval(1000, fn() {
      dispatch(msg)
    })
    Nil
  })
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
  StateReset
  CanvasDraw(CanvasAction)
  InputUpdate(String, String)
  InputIncrement(String)
  InputDecrement(String)
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  let ints_dict = dict.from_list([#("icons", 5), #("fizzbuzz", 10)])
  case model {
    Model(current_route, state, theme) -> {
      case msg {
        OnRouteChange(route) -> #(Model(route, state, theme), effect.none())
        StateReset -> #(Model(current_route, State(inputs: dict.new(), ints: ints_dict), theme), effect.none())
        CanvasDraw(_action) -> #(Model(current_route, state, theme), effect.none())
        InputUpdate(name, value) -> #(Model(current_route, State(inputs: dict.insert(state.inputs, name, value), ints: state.ints), theme), effect.none())
        InputIncrement(name) -> #(
          Model(current_route,
          State(inputs: state.inputs, ints: dict.map_values(state.ints, fn(k: String, v: Int) {case k {
            n if n == name -> v + 1
            _ -> v
          }})), theme),
          effect.none()
        )
        InputDecrement(name) -> #(
          Model(current_route, 
          State(inputs: state.inputs, ints: dict.map_values(state.ints, fn(k: String, v: Int) {case k, v {
            n, i if n == name && i > 0 -> v - 1
            _, _ -> v
          }})), theme), 
          effect.none()
        )
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
        navbar(model),
        // Routing
        html.div([custom_styles, attribute.style([#("background", result.unwrap(dict.get(model.state.inputs, "colour"), ""))])], [
          case model {
            Model(Index, _, _) -> index(model)
            Model(About, _, _) -> about(model)
          },
        ]),
        html.div([
          case dict.get(model.state.inputs, "colour") {
            Ok("red") -> attribute.style([#("background", "#882222")])
            _ -> attribute.none()
          }], 
          [carousel(images)]
        ),
        ui.centre([], html.div([], [
          html.div([], [
            input_box(model, "image_input", "[image_input]", [classes.text_2xl(), attribute.style([#("width", "full")]), input.primary()]),
          ]),
          html.div([], [
            case dict.get(model.state.inputs, "image_input") {
              Ok("") -> element.none()
              Ok(img) -> raw_image(img)
              _ -> element.none()
            },
          ]),
        ])),
        footer(model),
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

fn navbar(model: Model) -> Element(Msg) {
  html.div([classes.shadow_md()], [
    ui.centre([], html.nav([], [
      html.a([attribute.href("/")], [
        ui.button([event.on_click(InputUpdate("colour", ""))], [element.text("Index")]),
      ]),
      html.a([],[element.text(" | ")]),
      html.a([], [
        case dict.get(model.state.inputs, "colour") {
          Ok("red") -> ui.button([button.solid(), button.error(), event.on_click(InputUpdate("colour", ""))], [element.text("RED MODE: ON ")])
          _ -> ui.button([button.solid(), button.error(), event.on_click(InputUpdate("colour", "red"))], [element.text("RED MODE: OFF")])
        }
      ]),
      html.a([],[element.text(" | ")]),
      html.a([], [
        ui.button([button.solid(), button.info(), event.on_click(StateReset)], [element.text("RESET")])
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

fn raw_image(source: String) -> Element(Msg) {
  imageloader(ImageRef(title: "image", location: source))
}

fn imageloader(image: ImageRef) -> Element(Msg) {
  html.div([attribute.style([#("display", "flex"), #("flex-grow", "4")])], [
    html.img([attribute.src(image.location), attribute.alt(image.title), attribute.width(500), attribute.height(600)]),
  ])
}

fn fizzbuzz(num: Int) -> List(Element(Msg)) {
  [ui.centre([centre.inline()], html.div([attribute.style([#("display", "flex"), #("align-items", "center"), #("flex-wrap", "wrap"), #("gap", "10px")])], do_fizzbuzz(num, 1, [])))]
}

fn do_fizzbuzz(num: Int, acc: Int, textlist: List(Element(Msg))) -> List(Element(Msg)) {
  case acc {
    n if n == num + 1 -> textlist
    n if n >= 0 && n % 15 == 0 && n > 30 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [ui.centre([], html.p([classes.text_5xl(), ], [element.text("SUPER FIZZBUZZ TIMES " <> int.to_string({n / 15} - 1) <> "!")]))]]))
    n if n >= 0 && n % 15 == 0 && n > 15 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [ui.centre([], html.p([classes.text_3xl()], [element.text("SUPER FIZZBUZZ!")]))]]))
    n if n >= 0 && n % 15 == 0 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [ui.centre([], html.p([classes.text_2xl()], [element.text("FIZZBUZZ!")]))]]))
    n if n >= 0 && n % 3 == 0 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [html.div([], [element.text("fizz")])]]))
    n if n >= 0 && n % 5 == 0 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [html.div([], [element.text("buzz")])]]))
    n if n >= 0 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [html.div([], [element.text(int.to_string(acc))])]]))
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
    ui.centre([], html.div([], [ 
      ui.aside([],
        ui.button([event.on_click(InputDecrement("icons"))], [element.text("-")]),
        ui.button([event.on_click(InputIncrement("icons"))], [element.text("+")]),
      ),
    ])),
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

fn about(model: Model) -> Element(Msg) {
  html.div([attribute.style([#("min-height", "80rem")])], [
    ui.prose([prose.full()], [
      ui.centre([], html.h1([classes.pb_lg()], [element.text("TRAINING ARC")])),
    ]),
    ui.centre([button.warning(), classes.pb_lg()], ui.button([event.on_click(InputIncrement("fizzbuzz"))], [html.p([classes.font_alt(), classes.text_5xl()], [element.text("MORE POWER")])])),
    html.div([classes.text_xl(), classes.font_mono(), attribute.style([#("display", "flex"), #("justify-content", "center")])],
      fizzbuzz(result.unwrap(dict.get(model.state.ints, "fizzbuzz"), 10)),
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
