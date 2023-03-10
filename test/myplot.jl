using Plots
function my_data(n)
    data = randn(n)
    return data
end
function my_plot(data)
    plt = plot(data; label="My data", linewidth=2)
    return plt
end