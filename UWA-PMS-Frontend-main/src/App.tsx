import {
  Box,
  Button,
  Checkbox,
  ClientOnly,
  HStack,
  Heading,
  Progress,
  RadioGroup,
  Skeleton,
  VStack,
} from "@chakra-ui/react"
import { ColorModeToggle } from "./color-mode-toggle"
import { Outlet } from "react-router"
import RouteConfigs from "./app-routes"
import "./index.css"

export default function Page() {
  
  return (
    <>
      <RouteConfigs />
      <Outlet />
    </>
  )
}
