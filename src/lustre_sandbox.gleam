import gleam/dict
import gleam/io
import gleam/uri.{type Uri}
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/ui.{type Theme, Theme}
import lustre/ui/colour
import lustre/ui/styles
import modem
import plinth/javascript/global

import components/carousel
import components/ints
import lustre_sandbox/lib
import lustre_sandbox/lib/msg.{type Msg}
import lustre_sandbox/lib/types.{
  type ImageRef, type Model, type State, ImageRef, Model, State,
}
import pages/app

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

pub fn initial_state() {
  let test_image =
    ImageRef(
      title: "stars",
      location: "https://images.unsplash.com/photo-1733103373160-003dc53ccdba?q=80&w=1987&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    )
  let test_image2 =
    ImageRef(
      title: "street",
      location: "https://images.unsplash.com/photo-1731978009363-21fa723e2cbe?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    )
  let local_image = ImageRef(title: "local", location: "./image.jpeg")
  let images = [test_image2, local_image, test_image]

  let theme =
    Theme(
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
    images: images,
    ints: dict.from_list([#("icons", 5), #("fizzbuzz", 10)]),
    carousels: dict.from_list([#("test", types.CarouselState(0, images, True))]),
  )
}

fn init(_) -> #(Model, Effect(Msg)) {
  #(
    Model(initial_state()),
    effect.batch([
      modem.init(on_url_change),
      lib.set_interval(1000, msg.IntMessage(msg.IntIncrement("fizzbuzz"))),
      lib.set_interval(5000, msg.CarouselMessage(msg.NextSlideIfAuto("test"))),
    ]),
  )
}

fn on_url_change(uri: Uri) -> Msg {
  io.println(uri.path)
  case uri.path_segments(uri.path) {
    ["lustre-sandbox", "index"] -> msg.OnRouteChange(msg.Index)
    ["lustre-sandbox", "about"] -> msg.OnRouteChange(msg.About)
    _ -> msg.OnRouteChange(msg.Index)
  }
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    msg.OnRouteChange(route) -> #(
      Model(State(..model.state, route: route)),
      effect.none(),
    )
    msg.StateReset -> #(
      Model(State(..initial_state(), route: model.state.route)),
      effect.none(),
    )
    msg.InputUpdate(name, value) -> #(
      Model(
        State(
          ..model.state,
          inputs: dict.insert(model.state.inputs, name, value),
        ),
      ),
      effect.none(),
    )
    msg.IntMessage(intmsg) -> ints.message_handler(model, intmsg)
    msg.CarouselMessage(carouselmsg) ->
      carousel.message_handler(model, carouselmsg)
  }
}

fn view(model: Model) -> Element(Msg) {
  html.div([], [
    ui.stack([attribute.id("container")], [
      styles.theme(model.state.theme),
      styles.elements(),
      app.app(model),
    ]),
  ])
}
